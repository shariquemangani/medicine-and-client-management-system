/**
 * Returns a same-origin path (with query and hash) for a `?redirect=` value, or null when the value
 * could leave the site. Parsing with `URL` instead of string prefixes also catches forms browsers
 * normalise to another host, such as `/\evil.com` (a backslash counts as a slash).
 */
export function safeRedirectTarget(requested: string | null | undefined, origin: string): string | null {
  if (!requested || !requested.startsWith('/')) return null
  try {
    const url = new URL(requested, origin)
    if (url.origin !== origin) return null
    const target = `${url.pathname}${url.search}${url.hash}`
    // A normalised path such as `//evil.com` would be read as protocol-relative when assigned.
    return target.startsWith('//') ? null : target
  } catch {
    return null
  }
}
