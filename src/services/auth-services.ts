import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/app'
import { mapFirebaseAuthError } from '@/lib/firebase/auth-errors'
import { normalizeAuthEmail, normalizeAuthFullName } from '@/lib/firebase/auth-input'
import { persistBusinessId, clearBusinessId } from '@/lib/firebase/business-context'
import { clearAuthSession, persistAuthSession } from '@/lib/auth-session'
import { normalizeUserRole } from '@/lib/permissions'
import type { AdminUser } from '@/types'

const SESSION_ROUTE = '/api/auth/session'
const LOGOUT_ROUTE = '/api/auth/logout'

let establishSessionPromise: Promise<void> | null = null
let restoreSessionPromise: Promise<{ user: AdminUser; token: string } | null> | null = null
let logoutPromise: Promise<{ success: boolean }> | null = null

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

async function createTenantForNewAdmin(
  uid: string,
  fullName: string,
  email: string
): Promise<AdminUser> {
  const now = new Date().toISOString()
  const profile = {
    name: fullName,
    email,
    role: 'super_admin' as const,
    businessId: uid,
    isActive: true,
    createdAt: now,
  }

  await setDoc(doc(db, 'users', uid), profile)
  await setDoc(doc(db, 'businesses', uid), {
    createdAt: now,
    profile: {
      name: `${fullName}'s Clinic`,
      logoUrl: 'https://dummyimage.com/120x120/1e3a5f/ffffff.png&text=MF',
      address: '',
      phone: '',
      email,
      website: '',
    },
    clinicConfig: {
      fiscalYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      defaultCurrency: 'INR',
    },
  })

  return toAdminUser(uid, profile)
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
    if (password.length < 6) {
      return { success: false as const, message: 'Password must be at least 6 characters' }
    }

    let createdUser: User | null = null

    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      createdUser = credential.user

      await updateProfile(createdUser, { displayName: trimmedName })

      const profile = await createTenantForNewAdmin(createdUser.uid, trimmedName, normalizedEmail)
      const result = await completeSignIn(createdUser, profile)
      return { success: true as const, ...result }
    } catch (error) {
      if (createdUser) {
        try {
          await deleteUser(createdUser)
        } catch {
          // Auth user may already be removed
        }
      }
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
        clearAuthSession()
        clearBusinessId()
        return null
      }

      const profile = await fetchUserProfile(user.uid)
      if (!profile || !profile.isActive) {
        await clearServerSession()
        await clearLocalAuthState()
        return null
      }

      const token = await user.getIdToken(true)
      await establishSession(token)
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
