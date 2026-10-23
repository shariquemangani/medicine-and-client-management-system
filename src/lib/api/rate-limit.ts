import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

/**
 * Fixed-window rate limiter shared by every serverless instance: the counter lives in Firestore
 * (`rateLimits/{scope}_{hash(key)}`, Admin SDK only, the rules deny browsers), so cold starts and
 * parallel instances cannot reset it. Costs one read and one write per checked request.
 */

export interface RateLimitOptions {
  /** Short name of the protected action, e.g. "register". */
  scope: string
  /** Who is being limited: an IP address or a user id. */
  key: string
  max: number
  windowMs: number
}

export interface WindowState {
  count: number
  resetAt: number
}

/** Pure window arithmetic (unit-tested): returns the next state and whether the call is allowed. */
export function advanceWindow(
  state: WindowState | undefined,
  now: number,
  max: number,
  windowMs: number
): { next: WindowState; allowed: boolean } {
  if (!state || state.resetAt <= now) {
    return { next: { count: 1, resetAt: now + windowMs }, allowed: true }
  }
  const count = state.count + 1
  return { next: { count, resetAt: state.resetAt }, allowed: count <= max }
}

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

/**
 * Returns true when the caller is within the limit. If Firestore itself is unavailable the check
 * is skipped (and logged) so an outage cannot lock everyone out.
 */
export async function checkRateLimit({ scope, key, max, windowMs }: RateLimitOptions): Promise<boolean> {
  const id = `${scope}_${createHash('sha256').update(key).digest('hex').slice(0, 32)}`
  const ref = adminDb.doc(`rateLimits/${id}`)
  try {
    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const current = snap.exists ? (snap.data() as WindowState) : undefined
      const { next, allowed } = advanceWindow(current, Date.now(), max, windowMs)
      // `expiresAt` lets a Firestore TTL policy on this field delete stale counters automatically.
      tx.set(ref, { ...next, expiresAt: new Date(next.resetAt + windowMs) })
      return allowed
    })
  } catch (error) {
    console.error('[rate-limit] check failed, allowing request', error)
    return true
  }
}
