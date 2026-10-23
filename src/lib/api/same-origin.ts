import type { NextRequest } from 'next/server'
import { DomainError } from '@/lib/api/api-error'

/**
 * Defence in depth for cookie-authenticated POST/PATCH routes (SameSite=Lax already blocks the
 * cookie on cross-site POSTs): refuse requests the browser marks as cross-site or whose Origin is
 * another site. Requests without these headers (curl, server-to-server) are not browser CSRF.
 */
export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) throw new DomainError('Forbidden', 403)
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new DomainError('Forbidden', 403)
}
