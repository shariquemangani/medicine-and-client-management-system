import { safeRedirectTarget } from '../src/lib/safe-redirect'
import { buildContentSecurityPolicy } from '../src/lib/csp'
import { safeSegment } from '../src/lib/api/path-segment'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const ORIGIN = 'https://app.example.com'

// Open-redirect guard: only same-origin paths survive.
assert(safeRedirectTarget('/patients?x=1#top', ORIGIN) === '/patients?x=1#top', 'keeps a normal path with query and hash')
assert(safeRedirectTarget('/dashboard', ORIGIN) === '/dashboard', 'keeps a simple path')
for (const bad of ['//evil.com', String.raw`/\evil.com`, String.raw`/\/evil.com`, 'https://evil.com', 'javascript:alert(1)', '', 'evil.com', '///evil.com', '/%5Cevil.com/..//evil.com', String.raw`/\evil.com/x`]) {
  const result = safeRedirectTarget(bad, ORIGIN)
  assert(result === null || result.startsWith('/') && !result.startsWith('//'), `rejects or neutralises ${JSON.stringify(bad)} (got ${result})`)
}
assert(safeRedirectTarget('//evil.com', ORIGIN) === null, 'protocol-relative URL is rejected')
assert(safeRedirectTarget(String.raw`/\evil.com`, ORIGIN) === null, 'backslash host is rejected')
assert(safeRedirectTarget(null, ORIGIN) === null, 'null is rejected')

// CSP: nonce present, no blanket unsafe-inline for scripts, no wildcard script hosts.
const csp = buildContentSecurityPolicy('abc123', true)
const script = csp.split('; ').find((d) => d.startsWith('script-src')) ?? ''
assert(script.includes("'nonce-abc123'") && script.includes("'strict-dynamic'"), 'script-src uses nonce + strict-dynamic')
assert(!script.includes("'unsafe-inline'") && !script.includes("'unsafe-eval'"), 'production script-src has no unsafe-inline/eval')
assert(buildContentSecurityPolicy('n', false).includes("'unsafe-eval'"), 'development allows eval for Fast Refresh')
assert(csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"), 'framing and plugins stay blocked')
assert(!csp.includes('*.googleapis.com'), 'no wildcard googleapis connect-src')

// Route params: plain ids only.
assert(safeSegment('abc_DEF-123') === 'abc_DEF-123', 'accepts a normal id')
for (const bad of ['a/b', '..', 'a?b=1', 'a#b', '', 'x'.repeat(129), 'a b']) {
  let threw = false
  try {
    safeSegment(bad)
  } catch {
    threw = true
  }
  assert(threw, `rejects ${JSON.stringify(bad)}`)
}

console.log('verify-security-helpers: all checks passed')
