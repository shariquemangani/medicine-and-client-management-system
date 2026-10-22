import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/firebase/session'
import { PROTECTED_PATHS, ROUTES } from '@/lib/routes'

const authPaths = [ROUTES.home, ROUTES.register]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Set NEXT_PUBLIC_ALLOW_REGISTRATION=false once the owner account exists.
  if (pathname === ROUTES.register && process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'false') {
    return NextResponse.redirect(new URL(ROUTES.home, request.url))
  }
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const hasSession = Boolean(session && session.trim().length > 0)

  if (isProtected && !hasSession) {
    const loginUrl = new URL(ROUTES.home, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if ((authPaths as readonly string[]).includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, request.url))
  }

  return NextResponse.next()
}

/** Keep matcher paths as static literals (Next.js requirement). */
export const config = {
  matcher: [
    '/',
    '/register',
    '/dashboard/:path*',
    '/patients/:path*',
    '/vault',
    '/vault/:path*',
    '/medicines/:path*',
    '/inventory/:path*',
    '/prescriptions/:path*',
    '/billing/:path*',
    '/settings/:path*',
  ],
}
