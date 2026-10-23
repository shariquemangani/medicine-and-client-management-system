import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/firebase/session'
import { buildContentSecurityPolicy } from '@/lib/csp'
import { isRegistrationOpen } from '@/lib/registration'
import { PROTECTED_PATHS, ROUTES } from '@/lib/routes'

const authPaths = [ROUTES.home, ROUTES.register]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Registration is closed unless ALLOW_REGISTRATION=true.
  if (pathname === ROUTES.register && !isRegistrationOpen()) {
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

  // Per-request nonce: Next.js reads it from the request's CSP header and stamps its own scripts.
  const nonce = btoa(crypto.randomUUID())
  const csp = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === 'production')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

/**
 * Every page (so each gets a CSP nonce), but not API routes or static assets.
 * Must stay a static literal (Next.js requirement).
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
