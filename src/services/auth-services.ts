import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore/lite'
import { auth, db } from '@/lib/firebase/app'
import { mapFirebaseAuthError } from '@/lib/firebase/auth-errors'
import { normalizeAuthEmail, normalizeAuthFullName } from '@/lib/firebase/auth-input'
import { persistBusinessId, clearBusinessId } from '@/lib/firebase/business-context'
import { clearAuthSession, persistAuthSession } from '@/lib/auth-session'
import { normalizeUserRole } from '@/lib/permissions'
import type { AdminUser } from '@/types'

import { SESSION_FLAG_COOKIE_NAME } from '@/lib/firebase/session'

const SESSION_ROUTE = '/api/auth/session'
const REGISTER_ROUTE = '/api/auth/register'
const LOGOUT_ROUTE = '/api/auth/logout'

let establishSessionPromise: Promise<void> | null = null
let restoreSessionPromise: Promise<{ user: AdminUser; token: string } | null> | null = null
let logoutPromise: Promise<{ success: boolean }> | null = null

/** True when the server session cookie was issued (companion flag cookie is readable by JS). */
function hasSessionFlag(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c.startsWith(`${SESSION_FLAG_COOKIE_NAME}=`))
}

function resetAuthRuntimeState() {
  establishSessionPromise = null
  restoreSessionPromise = null
}

function toAdminUser(uid: string, data: Record<string, unknown>): AdminUser {
  return {
    id: uid,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    role: normalizeUserRole(data.role as string | undefined),
    businessId: String(data.businessId ?? uid),
    isActive: data.isActive !== false,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
  }
}

async function clearServerSession(): Promise<void> {
  try {
    await fetch(LOGOUT_ROUTE, { method: 'POST', credentials: 'include' })
  } catch {
    // Continue clearing local session even if the request fails
  }
}

async function clearLocalAuthState(): Promise<void> {
  resetAuthRuntimeState()
  try {
    await signOut(auth)
  } catch {
    // ignore — user may already be signed out
  }
  clearAuthSession()
  clearBusinessId()
}

async function establishSession(idToken: string): Promise<void> {
  if (establishSessionPromise) {
    return establishSessionPromise
  }

  establishSessionPromise = (async () => {
    const res = await fetch(SESSION_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message ?? 'Failed to establish session')
    }
  })()

  try {
    await establishSessionPromise
  } finally {
    establishSessionPromise = null
  }
}

export async function fetchUserProfile(uid: string): Promise<AdminUser | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return toAdminUser(uid, snap.data() as Record<string, unknown>)
}

async function completeSignIn(user: User, profile: AdminUser) {
  const idToken = await user.getIdToken(true)
  await establishSession(idToken)
  persistAuthSession(profile)
  persistBusinessId(profile.businessId)
  return { user: profile, token: idToken }
}

export const authService = {
  hasSessionFlag,

  /**
   * Sends a Firebase password-reset email. Always reports success for unknown
   * addresses so the form cannot be used to discover which emails have accounts.
   */
  requestPasswordReset: async (email: string) => {
    const normalizedEmail = normalizeAuthEmail(email)
    if (!normalizedEmail) {
      return { success: false as const, message: 'Enter your email address first' }
    }
    try {
      await sendPasswordResetEmail(auth, normalizedEmail)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code !== 'auth/user-not-found' && code !== 'auth/invalid-email') {
        return { success: false as const, message: mapFirebaseAuthError(error, 'Could not send the reset email') }
      }
    }
    return { success: true as const }
  },

  login: async (email: string, password: string) => {
    const normalizedEmail = normalizeAuthEmail(email)

    if (!normalizedEmail) {
      return { success: false as const, message: 'Email is required' }
    }
    if (!password) {
      return { success: false as const, message: 'Password is required' }
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
      const profile = await fetchUserProfile(credential.user.uid)

      if (!profile) {
        await signOut(auth)
        return {
          success: false as const,
          message:
            'Account setup is incomplete. Please register through the app or contact your administrator.',
        }
      }

      if (!profile.isActive) {
        await signOut(auth)
        return {
          success: false as const,
          message: 'This account has been disabled',
        }
      }

      const result = await completeSignIn(credential.user, profile)
      return { success: true as const, ...result }
    } catch (error) {
      return {
        success: false as const,
        message: mapFirebaseAuthError(error, 'Login failed'),
      }
    }
  },

  register: async (fullName: string, email: string, password: string) => {
    const normalizedEmail = normalizeAuthEmail(email)
    const trimmedName = normalizeAuthFullName(fullName)

    if (!trimmedName || trimmedName.length < 2) {
      return { success: false as const, message: 'Full name must be at least 2 characters' }
    }
    if (!normalizedEmail) {
      return { success: false as const, message: 'Email is required' }
    }
    if (password.length < 8) {
      return { success: false as const, message: 'Password must be at least 8 characters' }
    }

    try {
      // The owner account, profile and clinic document are created server-side (Admin SDK):
      // Firestore rules do not let browsers create `users` or `businesses` documents.
      const res = await fetch(REGISTER_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: trimmedName, email: normalizedEmail, password }),
      })
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) {
        return { success: false as const, message: body.message ?? 'Registration failed' }
      }

      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
      const profile = await fetchUserProfile(credential.user.uid)
      if (!profile) {
        await signOut(auth)
        return { success: false as const, message: 'Account was created but could not be loaded. Please sign in.' }
      }
      const result = await completeSignIn(credential.user, profile)
      return { success: true as const, ...result }
    } catch (error) {
      return {
        success: false as const,
        message: mapFirebaseAuthError(error, 'Registration failed'),
      }
    }
  },

  logout: async () => {
    if (logoutPromise) {
      return logoutPromise
    }

    logoutPromise = (async () => {
      resetAuthRuntimeState()
      await clearServerSession()
      await clearLocalAuthState()
      return { success: true }
    })()

    try {
      return await logoutPromise
    } finally {
      logoutPromise = null
    }
  },

  waitForAuthReady: (): Promise<User | null> =>
    new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user)
      })
    }),

  restoreSession: async () => {
    if (restoreSessionPromise) {
      return restoreSessionPromise
    }

    restoreSessionPromise = (async () => {
      const user = await authService.waitForAuthReady()
      if (!user) {
        // A leftover server cookie without a client user would make middleware
        // and the auth layout bounce between "/" and "/dashboard" forever.
        await clearServerSession()
        clearAuthSession()
        clearBusinessId()
        return null
      }

      // A fresh token is only needed to mint a session cookie; skip that round trip when the
      // cookie already exists. Profile read and token refresh are independent — run in parallel.
      const needsCookie = !hasSessionFlag()
      const [profile, token] = await Promise.all([
        fetchUserProfile(user.uid),
        needsCookie ? user.getIdToken(true) : Promise.resolve(''),
      ])
      if (!profile || !profile.isActive) {
        await clearServerSession()
        await clearLocalAuthState()
        return null
      }

      if (needsCookie) await establishSession(token)
      persistAuthSession(profile)
      persistBusinessId(profile.businessId)

      return { user: profile, token }
    })()

    try {
      return await restoreSessionPromise
    } finally {
      restoreSessionPromise = null
    }
  },
}
