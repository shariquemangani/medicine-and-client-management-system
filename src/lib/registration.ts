/**
 * Whether new clinic owners may register. Fails closed: an unset variable means closed.
 *
 * `ALLOW_REGISTRATION` is server-only and read at request time (change it and redeploy, or restart).
 * `NEXT_PUBLIC_ALLOW_REGISTRATION=true` is still honoured so existing deployments keep working, but
 * it is inlined at build time, so prefer the server-only variable.
 */
export function isRegistrationOpen(): boolean {
  const serverFlag = process.env.ALLOW_REGISTRATION
  if (serverFlag !== undefined && serverFlag !== '') return serverFlag === 'true'
  return process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'true'
}
