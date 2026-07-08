import { NextRequest } from 'next/server'
import { adminAuth, adminDb, SESSION_COOKIE_NAME } from '@/lib/firebase/admin'
import type { AdminUser } from '@/types'

export class ApiAuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function isFirebaseAuthError(error: unknown): error is { codePrefix?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'codePrefix' in error &&
    (error as { codePrefix?: string }).codePrefix === 'auth'
  )
}

export async function requireApiSession(
  request: NextRequest
): Promise<{ uid: string; businessId: string; profile: AdminUser }> {
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!session) {
    throw new ApiAuthError('Unauthorized', 401)
  }

  let decoded: { uid: string }
  try {
    decoded = await adminAuth.verifySessionCookie(session, true)
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      throw new ApiAuthError('Unauthorized', 401)
    }
    throw error
  }

  const profileSnap = await adminDb.doc(`users/${decoded.uid}`).get()
  if (!profileSnap.exists) {
    throw new ApiAuthError('Unauthorized', 401)
  }

  const data = profileSnap.data() as Record<string, unknown>
  const profile: AdminUser = {
    id: decoded.uid,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    role: (data.role as AdminUser['role']) ?? 'staff',
    businessId: String(data.businessId ?? decoded.uid),
    isActive: data.isActive !== false,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
  }

  if (!profile.isActive) {
    throw new ApiAuthError('Account disabled', 403)
  }

  return { uid: decoded.uid, businessId: profile.businessId, profile }
}
