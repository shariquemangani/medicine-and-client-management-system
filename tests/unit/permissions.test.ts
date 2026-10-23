import { describe, expect, it } from 'vitest'
import {
  canAccessPath,
  getDefaultAccessiblePath,
  getResourceForPath,
  isUserActive,
  normalizeUserRole,
  roleHasPermission,
} from '@/lib/permissions'

describe('role normalisation (fails closed)', () => {
  it('only an explicit super_admin is an admin', () => {
    expect(normalizeUserRole('super_admin')).toBe('super_admin')
    expect(normalizeUserRole('staff')).toBe('staff')
    expect(normalizeUserRole('admin')).toBe('staff')
    expect(normalizeUserRole('SUPER_ADMIN')).toBe('staff')
    expect(normalizeUserRole('')).toBe('staff')
    expect(normalizeUserRole(undefined)).toBe('staff')
    expect(normalizeUserRole(null)).toBe('staff')
  })

  it('an account is active unless explicitly disabled', () => {
    expect(isUserActive(true)).toBe(true)
    expect(isUserActive(undefined)).toBe(true)
    expect(isUserActive(false)).toBe(false)
  })
})

describe('permission matrix', () => {
  it('admins can do everything', () => {
    for (const resource of ['patients', 'medicines', 'inventory', 'billing', 'settings'] as const) {
      for (const action of ['view', 'create', 'edit', 'delete'] as const) {
        expect(roleHasPermission('super_admin', resource, action)).toBe(true)
      }
    }
  })

  it('staff cannot delete, cannot touch settings and only read the medicine vault', () => {
    expect(roleHasPermission('staff', 'patients', 'delete')).toBe(false)
    expect(roleHasPermission('staff', 'patients', 'create')).toBe(true)
    expect(roleHasPermission('staff', 'medicines', 'view')).toBe(true)
    expect(roleHasPermission('staff', 'medicines', 'edit')).toBe(false)
    expect(roleHasPermission('staff', 'billing', 'create')).toBe(true)
    expect(roleHasPermission('staff', 'billing', 'edit')).toBe(false)
    expect(roleHasPermission('staff', 'settings', 'view')).toBe(false)
  })

  it('an unknown role gets staff rights, never more', () => {
    expect(roleHasPermission('owner', 'settings', 'view')).toBe(false)
    expect(roleHasPermission(undefined, 'patients', 'delete')).toBe(false)
  })
})

describe('paths', () => {
  it('maps paths to resources', () => {
    expect(getResourceForPath('/patients/abc')).toBe('patients')
    expect(getResourceForPath('/vault/medicine')).toBe('medicines')
    expect(getResourceForPath('/billing')).toBe('billing')
    expect(getResourceForPath('/somewhere-else')).toBeNull()
  })

  it('stops staff from opening create screens or settings, but not list screens', () => {
    expect(canAccessPath('staff', '/patients')).toBe(true)
    expect(canAccessPath('staff', '/patients/new')).toBe(true)
    expect(canAccessPath('staff', '/vault/medicine')).toBe(true)
    expect(canAccessPath('staff', '/vault/medicine/new')).toBe(false)
    expect(canAccessPath('staff', '/vault/flag-configurations')).toBe(false)
    expect(canAccessPath('staff', '/settings')).toBe(false)
    expect(canAccessPath('super_admin', '/settings')).toBe(true)
  })

  it('sends a denied role to a page it can open', () => {
    const target = getDefaultAccessiblePath('staff')
    expect(canAccessPath('staff', target)).toBe(true)
  })
})
