import { describe, expect, it, vi } from 'vitest'
import { ApiAuthError } from '@/lib/api/api-auth-error'
import { DomainError, errorResponse, parseJsonBody } from '@/lib/api/api-error'
import { safeSegment } from '@/lib/api/path-segment'
import { advanceWindow } from '@/lib/api/rate-limit'
import { FirestoreHttpError } from '@/lib/firebase/firestore-rest'
import { buildContentSecurityPolicy } from '@/lib/csp'
import { safeRedirectTarget } from '@/lib/safe-redirect'
import {
  adminUserCreateSchema,
  diseaseInputSchema,
  flagCategoryInputSchema,
  flagCreateSchema,
  flagUpdateSchema,
} from '@/lib/schemas/api-schemas'
import { sanitizePatientUpdate } from '@/lib/patients/patient-server'

const json = (body: unknown) =>
  new Request('http://localhost/x', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })

async function bodyOf(res: Response) {
  return (await res.json()) as Record<string, unknown>
}

describe('errorResponse', () => {
  it('keeps the message and status of auth and domain errors', async () => {
    const auth = errorResponse(new ApiAuthError('Unauthorized', 401), 'T', 'fallback')
    expect(auth.status).toBe(401)
    expect(await bodyOf(auth)).toEqual({ error: 'Unauthorized' })

    const domain = errorResponse(new DomainError('Name taken', 409), 'T', 'fallback')
    expect(domain.status).toBe(409)
  })

  it('never leaks upstream text for unknown errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = errorResponse(new Error('secret project id leaked here'), 'T', 'Request failed')
    expect(res.status).toBe(500)
    expect(await bodyOf(res)).toEqual({ error: 'Request failed' })
  })

  it('maps Firestore denials and outages to safe statuses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(errorResponse(new FirestoreHttpError(403, 'Missing or insufficient permissions.'), 'T', 'f').status).toBe(403)
    expect(errorResponse(new FirestoreHttpError(404, 'nope'), 'T', 'f').status).toBe(404)
    const outage = errorResponse(new FirestoreHttpError(503, 'unavailable'), 'T', 'f')
    expect(outage.status).toBe(503)
    expect(await bodyOf(outage)).toEqual({ error: 'Service temporarily unavailable' })
  })

  it('uses the success/message shape for cookie routes', async () => {
    const res = errorResponse(new DomainError('Forbidden', 403), 'T', 'f', 'message')
    expect(await bodyOf(res)).toEqual({ success: false, message: 'Forbidden' })
  })
})

describe('parseJsonBody', () => {
  it('returns parsed data and trims strings', async () => {
    const data = await parseJsonBody(json({ name: '  Cold  ' }), diseaseInputSchema)
    expect(data.name).toBe('Cold')
  })

  it('rejects invalid JSON and wrong types with a 400 domain error', async () => {
    await expect(parseJsonBody(json('{nope'), diseaseInputSchema)).rejects.toMatchObject({ status: 400 })
    await expect(parseJsonBody(json({ name: 5 }), diseaseInputSchema)).rejects.toMatchObject({ status: 400 })
    await expect(parseJsonBody(json({ name: '' }), diseaseInputSchema)).rejects.toThrow(/required/i)
  })
})

describe('schemas', () => {
  it('bounds disease and flag text', () => {
    expect(diseaseInputSchema.safeParse({ name: 'x'.repeat(121) }).success).toBe(false)
    expect(diseaseInputSchema.safeParse({ name: 'ok', symptoms: ['a', 'b'] }).success).toBe(true)
    expect(diseaseInputSchema.safeParse({ name: 'ok', symptoms: 'a' }).success).toBe(false)
    expect(flagCategoryInputSchema.safeParse({ name: '   ' }).success).toBe(false)
    expect(flagUpdateSchema.safeParse({ label: 'x'.repeat(101) }).success).toBe(false)
  })

  it('requires at least one flag label', () => {
    expect(flagCreateSchema.safeParse({}).success).toBe(false)
    expect(flagCreateSchema.safeParse({ labels: ['', ' '] }).success).toBe(false)
    expect(flagCreateSchema.safeParse({ label: '30C' }).success).toBe(true)
    expect(flagCreateSchema.safeParse({ labels: ['30C', '200C'] }).success).toBe(true)
  })

  it('validates new team members', () => {
    const ok = adminUserCreateSchema.safeParse({ name: 'Asha K', email: ' Asha@Clinic.IO ', password: 'longenough', role: 'staff' })
    expect(ok.success).toBe(true)
    if (ok.success) expect(ok.data.email).toBe('asha@clinic.io')
    expect(adminUserCreateSchema.safeParse({ name: 'A', email: 'a@b.io', password: 'longenough', role: 'staff' }).success).toBe(false)
    expect(adminUserCreateSchema.safeParse({ name: 'Asha', email: 'nope', password: 'longenough', role: 'staff' }).success).toBe(false)
    expect(adminUserCreateSchema.safeParse({ name: 'Asha', email: 'a@b.io', password: 'short', role: 'staff' }).success).toBe(false)
    expect(adminUserCreateSchema.safeParse({ name: 'Asha', email: 'a@b.io', password: 'longenough', role: 'owner' }).success).toBe(false)
  })
})

describe('safeSegment', () => {
  it('accepts plain ids and rejects anything that could change a path', () => {
    expect(safeSegment('pat_1792_ab-C')).toBe('pat_1792_ab-C')
    for (const bad of ['a/b', '..', 'a?x=1', 'a#b', '', 'a b', 'x'.repeat(129)]) {
      expect(() => safeSegment(bad)).toThrow()
    }
  })
})

describe('rate limit window', () => {
  it('allows up to max, blocks after, and reopens when the window ends', () => {
    const W = 600_000
    let state = undefined as ReturnType<typeof advanceWindow>['next'] | undefined
    for (let i = 0; i < 5; i++) {
      const r = advanceWindow(state, 1000 + i, 5, W)
      expect(r.allowed).toBe(true)
      state = r.next
    }
    const blocked = advanceWindow(state, 2000, 5, W)
    expect(blocked.allowed).toBe(false)
    expect(blocked.next.resetAt).toBe(state!.resetAt)
    expect(advanceWindow(blocked.next, state!.resetAt, 5, W).allowed).toBe(true)
  })
})

describe('redirect and CSP helpers', () => {
  const origin = 'https://app.example.com'

  it('keeps same-origin paths only', () => {
    expect(safeRedirectTarget('/patients?x=1', origin)).toBe('/patients?x=1')
    for (const bad of ['//evil.com', String.raw`/\evil.com`, 'https://evil.com', 'javascript:alert(1)', '', null]) {
      expect(safeRedirectTarget(bad, origin)).toBeNull()
    }
  })

  it('builds a nonce-based policy without unsafe-inline scripts in production', () => {
    const csp = buildContentSecurityPolicy('abc', true)
    const script = csp.split('; ').find((d) => d.startsWith('script-src')) ?? ''
    expect(script).toContain("'nonce-abc'")
    expect(script).toContain("'strict-dynamic'")
    expect(script).not.toContain("'unsafe-inline'")
    expect(script).not.toContain("'unsafe-eval'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(buildContentSecurityPolicy('abc', false)).toContain("'unsafe-eval'")
  })
})

describe('sanitizePatientUpdate', () => {
  const current = { rollNumber: '202610001' }

  it('drops fields a user may not set and keeps editable ones', () => {
    const clean = sanitizePatientUpdate(
      { firstName: 'Asha', phone: '123', createdAt: '2000-01-01', id: 'other', evil: 'x' } as never,
      current
    ) as Record<string, unknown>
    expect(clean).toEqual({ firstName: 'Asha', phone: '123' })
  })

  it('refuses to change the patient ID but accepts the same one', () => {
    expect(() => sanitizePatientUpdate({ rollNumber: '999' } as never, current)).toThrow(/cannot be changed/)
    expect(sanitizePatientUpdate({ rollNumber: '202610001', address: 'x' } as never, current)).toEqual({ address: 'x' })
  })

  it('rejects oversized text', () => {
    expect(() => sanitizePatientUpdate({ notes: 'a'.repeat(5001) } as never, current)).toThrow(/too long/)
  })
})
