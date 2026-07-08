import { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { fetchUserBusinessId } from '@/lib/firebase/firestore-rest'

export class ApiAuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
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

export async function requireAuthenticatedIdToken(
  request: NextRequest
): Promise<{ uid: string; idToken: string }> {
  const idToken = readBearerToken(request)
  if (!idToken) {
    throw new ApiAuthError('Unauthorized', 401)
  }

  let decoded: { uid: string }
  try {
    decoded = await adminAuth.verifyIdToken(idToken)
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      throw new ApiAuthError('Unauthorized', 401)
    }
    throw error
  }

  return { uid: decoded.uid, idToken }
}

export async function requireApiIdToken(
  request: NextRequest
): Promise<{ uid: string; idToken: string; businessId: string }> {
  const { uid, idToken } = await requireAuthenticatedIdToken(request)

  const businessId = await fetchUserBusinessId(idToken, uid)
  if (!businessId) {
    throw new ApiAuthError('Unauthorized', 401)
  }

  return { uid, idToken, businessId }
}
