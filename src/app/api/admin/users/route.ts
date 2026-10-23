import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { DomainError, errorResponse, parseJsonBody } from '@/lib/api/api-error'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { assertSameOrigin } from '@/lib/api/same-origin'
import { requireApiSession } from '@/lib/api/require-api-session'
import { adminUserCreateSchema } from '@/lib/schemas/api-schemas'

const WINDOW_MS = 10 * 60 * 1000
const MAX_CREATES = 20

/** Creates a team member (Auth user + users/{uid} profile) in the caller's clinic. Admin only. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request)
    const { uid: actorUid, businessId, profile } = await requireApiSession(request)
    if (profile.role !== 'super_admin') {
      throw new DomainError('Forbidden', 403)
    }
    const withinLimit = await checkRateLimit({
      scope: 'create-user',
      key: actorUid,
      max: MAX_CREATES,
      windowMs: WINDOW_MS,
    })
    if (!withinLimit) throw new DomainError('Too many attempts. Try again in a few minutes', 429)

    const body = await parseJsonBody(request, adminUserCreateSchema)
    const name = body.name.replace(/\s+/g, ' ')

    let created
    try {
      created = await adminAuth.createUser({ email: body.email, password: body.password, displayName: name })
    } catch (error) {
      if ((error as { code?: string }).code === 'auth/email-already-exists') {
        throw new DomainError('A user with this email already exists', 409)
      }
      throw error
    }

    const now = new Date().toISOString()
    try {
      await adminDb.doc(`users/${created.uid}`).set({
        name,
        email: body.email,
        role: body.role,
        businessId,
        isActive: true,
        createdAt: now,
      })
    } catch (error) {
      // Do not leave an Auth account without a profile (it could never sign in).
      await adminAuth.deleteUser(created.uid).catch(() => undefined)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        id: created.uid,
        name,
        email: body.email,
        role: body.role,
        businessId,
        isActive: true,
        createdAt: now,
      },
    })
  } catch (error) {
    return errorResponse(error, 'POST /api/admin/users', 'Failed to create user', 'message')
  }
}
