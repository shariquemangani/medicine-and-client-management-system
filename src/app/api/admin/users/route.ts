import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb, SESSION_COOKIE_NAME } from '@/lib/firebase/admin'
import type { UserRole } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get(SESSION_COOKIE_NAME)?.value
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await adminAuth.verifySessionCookie(session, true)
    const inviterSnap = await adminDb.doc(`users/${decoded.uid}`).get()
    if (!inviterSnap.exists) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const inviter = inviterSnap.data() as { businessId: string; role: UserRole }
    if (inviter.role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as {
      name?: string
      email?: string
      password?: string
      role?: UserRole
    }

    if (!body.name?.trim() || !body.email?.trim() || !body.password || !body.role) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 })
    }

    const name = body.name.trim().replace(/\s+/g, ' ')
    const email = body.email.trim().toLowerCase()

    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const created = await adminAuth.createUser({
      email,
      password: body.password,
      displayName: name,
    })

    const now = new Date().toISOString()
    await adminDb.doc(`users/${created.uid}`).set({
      name,
      email,
      role: body.role,
      businessId: inviter.businessId,
      isActive: true,
      createdAt: now,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: created.uid,
        name,
        email,
        role: body.role,
        businessId: inviter.businessId,
        isActive: true,
        createdAt: now,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    return NextResponse.json({ success: false, message }, { status: 400 })
  }
}
