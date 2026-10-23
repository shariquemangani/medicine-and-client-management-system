/**
 * Content Security Policy, built per request so scripts can carry a nonce.
 *
 * - `script-src` uses a nonce + 'strict-dynamic': only scripts Next.js (and the scripts it loads)
 *   emit with the nonce run, so an injected inline script is blocked. Host allowlists are ignored by
 *   browsers that understand 'strict-dynamic' and exist only as a fallback for older ones.
 * - `unsafe-eval` is allowed in development only (React Fast Refresh).
 * - `connect-src` lists the exact Firebase endpoints used by Auth and the Firestore lite client.
 */
export function buildContentSecurityPolicy(nonce: string, isProd: boolean): string {
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const firebaseAuthHost = authDomain ? `https://${authDomain}` : 'https://*.firebaseapp.com'

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? '' : " 'unsafe-eval'"} https://va.vercel-scripts.com`,
    // Tailwind/shadcn/Radix set inline style attributes at runtime, so styles keep 'unsafe-inline'.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    [
      "connect-src 'self'",
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://www.googleapis.com',
      'https://firestore.googleapis.com',
      firebaseAuthHost,
      'https://vitals.vercel-insights.com',
      'https://va.vercel-scripts.com',
    ].join(' '),
    `frame-src 'self' ${firebaseAuthHost}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}
