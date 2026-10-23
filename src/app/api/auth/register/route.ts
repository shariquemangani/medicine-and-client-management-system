import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { checkRateLimit, clientIp } from '@/lib/api/rate-limit'
import { assertSameOrigin } from '@/lib/api/same-origin'
import { DomainError } from '@/lib/api/api-error'
import { isRegistrationOpen } from '@/lib/registration'

/**
 * Creates a new clinic owner (Auth user + users/{uid} + businesses/{uid}) with the Admin SDK.
 *
 * Firestore rules deny client-side creation of `users` and `businesses` documents, so nobody can
 * mint themselves a `super_admin` profile by calling Firebase Auth directly. Registration is only
 * possible through this route, and it is closed unless ALLOW_REGISTRATION=true (see lib/registration.ts).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request)
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    throw error
  }

  if (!isRegistrationOpen()) {
    return NextResponse.json({ success: false, message: 'Registration is closed' }, { status: 403 })
  }

  const withinLimit = await checkRateLimit({
    scope: 'register',
    key: clientIp(request),
    max: MAX_ATTEMPTS,
    windowMs: WINDOW_MS,
  })
  if (!withinLimit) {
    return NextResponse.json(
      { success: false, message: 'Too many attempts. Try again in a few minutes' },
      { status: 429 }
    )
  }

  let body: { fullName?: unknown; email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
  }

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim().replace(/\s+/g, ' ') : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json({ success: false, message: 'Full name must be 2-100 characters' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, message: 'Enter a valid email address' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 })
  }

  let uid: string | null = null
  try {
    const created = await adminAuth.createUser({ email, password, displayName: fullName })
    uid = created.uid

    const now = new Date().toISOString()
    const year = new Date().getFullYear()

    // Profile first, then the tenant document (matches how the rules and app read them).
    await adminDb.doc(`users/${uid}`).set({
      name: fullName,
      email,
      role: 'super_admin',
      businessId: uid,
      isActive: true,
      createdAt: now,
    })
    await adminDb.doc(`businesses/${uid}`).set({
      createdAt: now,
      profile: {
        name: `${fullName}'s Clinic`,
        logoUrl: '',
        address: '',
        phone: '',
        email,
        website: '',
      },
      academicConfig: {
        academicYear: `${year}-${year + 1}`,
        currentTerm: '',
        terms: [],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Roll back so a failed registration never leaves an orphan Auth user or profile.
    if (uid) {
      await adminDb.doc(`users/${uid}`).delete().catch(() => undefined)
      await adminAuth.deleteUser(uid).catch(() => undefined)
    }
    const code = (error as { code?: string }).code
    if (code === 'auth/email-already-exists') {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      )
    }
    console.error('[POST /api/auth/register]', error)
    return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 })
  }
}
