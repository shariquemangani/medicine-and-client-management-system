import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { errorResponse } from '@/lib/api/api-error'
import { safeSegment } from '@/lib/api/path-segment'
import { assertSameOrigin } from '@/lib/api/same-origin'
import { requireApiSession } from '@/lib/api/require-api-session'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Updates a team member (name, active flag).
 * Disabling also disables the Firebase Auth account and revokes refresh tokens, so the
 * user is blocked at sign-in and cannot keep a session alive, not only in Firestore.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request)
    const { uid: actorUid, businessId, profile } = await requireApiSession(request)
    if (profile.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const id = safeSegment((await context.params).id)
    const ref = adminDb.doc(`users/${id}`)
    const snap = await ref.get()
    if (!snap.exists || (snap.data() as { businessId?: string }).businessId !== businessId) {
      // Same answer for "missing" and "other clinic" so ids cannot be probed.
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    }

    const body = ((await request.json().catch(() => null)) ?? {}) as { name?: unknown; isActive?: unknown }
    const changes: { name?: string; isActive?: boolean } = {}

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''
      if (name.length < 2 || name.length > 100) {
        return NextResponse.json({ success: false, message: 'Name must be 2-100 characters' }, { status: 400 })
      }
      changes.name = name
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ success: false, message: 'isActive must be true or false' }, { status: 400 })
      }
      if (!body.isActive && id === actorUid) {
        return NextResponse.json(
          { success: false, message: 'You cannot disable your own account' },
          { status: 400 }
        )
      }
      changes.isActive = body.isActive
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ success: false, message: 'Nothing to update' }, { status: 400 })
    }

    if (changes.isActive !== undefined) {
      await adminAuth.updateUser(id, { disabled: !changes.isActive })
      if (!changes.isActive) await adminAuth.revokeRefreshTokens(id)
    }
    await ref.update(changes)

    const updated = { ...(snap.data() as Record<string, unknown>), ...changes, id }
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return errorResponse(error, 'PATCH /api/admin/users/:id', 'Failed to update user', 'message')
  }
}
