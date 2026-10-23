import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, SESSION_COOKIE_NAME } from '@/lib/firebase/admin'
import { SESSION_FLAG_COOKIE_NAME } from '@/lib/firebase/session'
import { assertSameOrigin } from '@/lib/api/same-origin'

const cookieClearOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 0,
  expires: new Date(0),
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request)
  } catch {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (session) {
    try {
      const decoded = await adminAuth.verifySessionCookie(session, true)
      await adminAuth.revokeRefreshTokens(decoded.sub)
    } catch {
      // Session already invalid — still clear the cookie below
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME)

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE_NAME, '', cookieClearOptions)
  response.cookies.set(SESSION_FLAG_COOKIE_NAME, '', { ...cookieClearOptions, httpOnly: false })
  return response
}
