import type { UserRole } from '@/types'
import { LEGACY_VAULT_PATH, ROUTES, SIDEBAR_SECTION_PATHS } from '@/lib/routes'

export type PermissionResource =
  | 'dashboard'
  | 'patients'
  | 'medicines'
  | 'inventory'
  | 'prescriptions'
  | 'billing'
  | 'settings'

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

type RolePermissionMap = Record<PermissionResource, PermissionAction[]>

const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete']

const SUPER_ADMIN_PERMISSIONS: RolePermissionMap = {
  dashboard: ALL_ACTIONS,
  patients: ALL_ACTIONS,
  medicines: ALL_ACTIONS,
  inventory: ALL_ACTIONS,
  prescriptions: ALL_ACTIONS,
  billing: ALL_ACTIONS,
  settings: ALL_ACTIONS,
}

const STAFF_PERMISSIONS: RolePermissionMap = {
  dashboard: ['view'],
  patients: ['view', 'create', 'edit'],
  medicines: ['view'],
  inventory: ['view', 'create', 'edit'],
  prescriptions: ['view', 'create', 'edit'],
  billing: ['view', 'create'],
  settings: [],
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissionMap> = {
  super_admin: SUPER_ADMIN_PERMISSIONS,
  staff: STAFF_PERMISSIONS,
}

const PATH_RESOURCE_MAP: { prefix: string; resource: PermissionResource }[] = [
  { prefix: ROUTES.dashboard, resource: 'dashboard' },
  { prefix: ROUTES.patients, resource: 'patients' },
  { prefix: ROUTES.vault, resource: 'medicines' },
  { prefix: LEGACY_VAULT_PATH, resource: 'medicines' },
  { prefix: ROUTES.inventory, resource: 'inventory' },
  { prefix: ROUTES.prescriptions, resource: 'prescriptions' },
  { prefix: ROUTES.billing, resource: 'billing' },
  { prefix: ROUTES.settings, resource: 'settings' },
]

export function normalizeUserRole(role: string | null | undefined): UserRole {
  // Fail closed: only an explicit super_admin role gets admin rights.
  if (role === 'super_admin') return 'super_admin'
  return 'staff'
}

export function isUserActive(isActive: boolean | null | undefined): boolean {
  return isActive !== false
}

export function getResourceForPath(pathname: string): PermissionResource | null {
  const match = PATH_RESOURCE_MAP.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`)
  )
  return match?.resource ?? null
}

export function roleHasPermission(
  role: UserRole | string | null | undefined,
  resource: PermissionResource,
  action: PermissionAction = 'view'
): boolean {
  const normalizedRole = normalizeUserRole(role)
  const allowed = ROLE_PERMISSIONS[normalizedRole]?.[resource] ?? []
  return allowed.includes(action)
}

export function canAccessPath(
  role: UserRole | string | null | undefined,
  pathname: string,
  action: PermissionAction = 'view'
): boolean {
  const resource = getResourceForPath(pathname)
  if (!resource) return true
  return roleHasPermission(role, resource, requiredActionForPath(pathname, action))
}

/**
 * Opening a view is `view`, but "create" screens (/new) need `create` and the shared flag
 * catalogue (only editable screen in the vault) needs `edit`, so read-only roles are redirected
 * instead of being shown forms whose writes would be rejected.
 */
function requiredActionForPath(pathname: string, action: PermissionAction): PermissionAction {
  if (action !== 'view') return action
  if (/\/new\/?$/.test(pathname)) return 'create'
  if (pathname === ROUTES.vaultFlags || pathname.startsWith(`${ROUTES.vaultFlags}/`)) return 'edit'
  return action
}

/** First path the role can open (used when current page is denied). */
export function getDefaultAccessiblePath(role: UserRole | string | null | undefined): string {
  const normalizedRole = normalizeUserRole(role)
  for (const path of SIDEBAR_SECTION_PATHS) {
    if (canAccessPath(normalizedRole, path, 'view')) return path
  }
  return ROUTES.home
}
