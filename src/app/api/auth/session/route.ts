import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb, SESSION_COOKIE_NAME, SESSION_EXPIRES_MS } from '@/lib/firebase/admin'
import { SESSION_FLAG_COOKIE_NAME } from '@/lib/firebase/session'
import { assertSameOrigin } from '@/lib/api/same-origin'

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request)
    const { idToken } = (await request.json()) as { idToken?: string }
    if (!idToken) {
      return NextResponse.json({ success: false, message: 'Missing idToken' }, { status: 400 })
    }

    const decoded = await adminAuth.verifyIdToken(idToken)

    // No session for accounts without a profile or that an admin has disabled.
    const profile = await adminDb.doc(`users/${decoded.uid}`).get()
    if (!profile.exists || (profile.data() as { isActive?: boolean }).isActive === false) {
      return NextResponse.json({ success: false, message: 'Account is disabled or not set up' }, { status: 403 })
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_MS,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRES_MS / 1000,
    })
    response.cookies.set(SESSION_FLAG_COOKIE_NAME, '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRES_MS / 1000,
    })
    return response
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/session] failed:', error)
    }
    return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 })
  }
}
