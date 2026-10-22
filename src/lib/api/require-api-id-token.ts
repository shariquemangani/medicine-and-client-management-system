import { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { fetchApiUserProfile, type ApiUserProfile } from '@/lib/firebase/firestore-rest'
import {
  isUserActive,
  roleHasPermission,
  type PermissionAction,
  type PermissionResource,
} from '@/lib/permissions'

export class ApiAuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** Role requirement for an endpoint; omit for "any signed-in, active user". */
export interface ApiPermission {
  resource: PermissionResource
  action: PermissionAction
}

function readBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token || null
}

function isFirebaseAuthError(error: unknown): error is { codePrefix?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'codePrefix' in error &&
    (error as { codePrefix?: string }).codePrefix === 'auth'
  )
}

interface VerifiedToken {
  uid: string
  idToken: string
  /** Resolves (or rejects with 401) once the account is confirmed not disabled/revoked. */
  accountCheck: Promise<void>
}

/**
 * Verifies the signature locally (no network) and starts the disabled/revoked check in the
 * background. Callers run it in parallel with the Firestore profile read, so the extra Auth
 * lookup does not add latency to the request.
 */
async function verifyToken(request: NextRequest): Promise<VerifiedToken> {
  const idToken = readBearerToken(request)
  if (!idToken) {
    throw new ApiAuthError('Unauthorized', 401)
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    const accountCheck = adminAuth.getUser(decoded.uid).then((user) => {
      const revokedAfter = user.tokensValidAfterTime ? Date.parse(user.tokensValidAfterTime) : 0
      if (user.disabled || decoded.iat * 1000 < revokedAfter) {
        throw new ApiAuthError('Unauthorized', 401)
      }
    })
    // Avoid an unhandled rejection if the caller fails earlier; the awaiting caller still sees it.
    accountCheck.catch(() => undefined)
    return { uid: decoded.uid, idToken, accountCheck }
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      throw new ApiAuthError('Unauthorized', 401)
    }
    throw error
  }
}

async function loadProfile(idToken: string, uid: string, permission?: ApiPermission) {
  const profile = await fetchApiUserProfile(idToken, uid)
  if (!profile) {
    throw new ApiAuthError('Unauthorized', 401)
  }
  if (!isUserActive(profile.isActive)) {
    throw new ApiAuthError('Account disabled', 403)
  }
  if (permission && !roleHasPermission(profile.role, permission.resource, permission.action)) {
    throw new ApiAuthError('Forbidden', 403)
  }
  return profile
}

export async function requireAuthenticatedIdToken(
  request: NextRequest,
  permission?: ApiPermission
): Promise<{ uid: string; idToken: string }> {
  const { uid, idToken, accountCheck } = await verifyToken(request)
  // Only look the profile up when a role check is required (keeps read paths cheap).
  await Promise.all([accountCheck, permission ? loadProfile(idToken, uid, permission) : undefined])
  return { uid, idToken }
}

export async function requireApiIdToken(
  request: NextRequest,
  permission?: ApiPermission
): Promise<{ uid: string; idToken: string; businessId: string; profile: ApiUserProfile }> {
  const { uid, idToken, accountCheck } = await verifyToken(request)
  const [profile] = await Promise.all([loadProfile(idToken, uid, permission), accountCheck])
  return { uid, idToken, businessId: profile.businessId, profile }
}
