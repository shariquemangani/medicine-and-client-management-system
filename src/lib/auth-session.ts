import type { AdminUser } from '@/types'
import { normalizeUserRole } from '@/lib/permissions'

const AUTH_USER_KEY = 'user'

function normalizeStoredUser(raw: AdminUser): AdminUser | null {
  if (!raw?.id || !raw?.email) return null
  return {
    id: raw.id,
    name: raw.name ?? '',
    email: raw.email,
    role: normalizeUserRole(raw.role),
    businessId: raw.businessId || raw.id,
    isActive: raw.isActive !== false,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

/** Persist signed-in profile for the app shell. Session stays until explicit logout. */
export function persistAuthSession(user: AdminUser, _rememberMe?: boolean) {
  if (typeof window === 'undefined') return

  const normalized = normalizeStoredUser(user)
  if (!normalized) return

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalized))
  localStorage.setItem('businessId', normalized.businessId)
  // Always keep signed in across browser restarts / next day
  localStorage.setItem('rememberMe', 'true')
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return

  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem('businessId')
  localStorage.removeItem('rememberMe')
  localStorage.removeItem('token')
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken')
  // Legacy flag that forced re-login — clear if present
  localStorage.removeItem('redirectToLogin')
}

export function readStoredAuthSession(): { user: AdminUser } | null {
  if (typeof window === 'undefined') return null

  const userRaw = localStorage.getItem(AUTH_USER_KEY)
  if (!userRaw) return null

  try {
    const user = normalizeStoredUser(JSON.parse(userRaw) as AdminUser)
    if (!user) {
      clearAuthSession()
      return null
    }
    return { user }
  } catch {
    clearAuthSession()
    return null
  }
}
