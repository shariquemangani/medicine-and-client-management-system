import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, SESSION_COOKIE_NAME, SESSION_EXPIRES_MS } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string }
    if (!idToken) {
      return NextResponse.json({ success: false, message: 'Missing idToken' }, { status: 400 })
    }

    await adminAuth.verifyIdToken(idToken)
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
    return response
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[auth/session] failed:', error)
    }
    return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 })
  }
}
