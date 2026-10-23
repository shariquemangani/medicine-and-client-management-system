import { NextResponse } from 'next/server'
import type { z } from 'zod'
import { ApiAuthError } from '@/lib/api/api-auth-error'
import { FirestoreHttpError } from '@/lib/firebase/firestore-rest'

/** An expected failure with a message that is safe to show the caller (validation, not found, conflict). */
export class DomainError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'DomainError'
    this.status = status
  }
}

/**
 * Maps any thrown value to a JSON response without leaking internals: auth and domain errors keep
 * their message, Firestore denials become 403/404, everything else is logged and answered with
 * `fallback` (500 by default; 503 when the upstream is unavailable).
 */
export function errorResponse(error: unknown, tag: string, fallback: string, bodyKey: 'error' | 'message' = 'error') {
  const body = (message: string) => ({ ...(bodyKey === 'message' ? { success: false } : {}), [bodyKey]: message })

  if (error instanceof ApiAuthError || error instanceof DomainError) {
    return NextResponse.json(body(error.message), { status: error.status })
  }
  if (error instanceof FirestoreHttpError) {
    if (error.status === 403) return NextResponse.json(body('Forbidden'), { status: 403 })
    if (error.status === 404) return NextResponse.json(body('Not found'), { status: 404 })
    if (error.status === 409 || /already exists/i.test(error.message)) {
      return NextResponse.json(body('Already exists'), { status: 409 })
    }
  }
  console.error(`[${tag}]`, error)
  const unavailable =
    (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) ||
    (error instanceof FirestoreHttpError && error.status >= 500)
  return NextResponse.json(body(unavailable ? 'Service temporarily unavailable' : fallback), {
    status: unavailable ? 503 : 500,
  })
}

/** Parses the JSON body with a Zod schema; throws a 400 DomainError naming the first problem. */
export async function parseJsonBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  const raw = await request.json().catch(() => {
    throw new DomainError('Request body must be valid JSON')
  })
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue.path.join('.')
    throw new DomainError(field ? `${field}: ${issue.message}` : issue.message)
  }
  return parsed.data
}
