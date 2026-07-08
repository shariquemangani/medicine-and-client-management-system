'use client'

import { useCallback, useMemo } from 'react'
import { useAppSelector } from '@/redux'
import {
  canAccessPath,
  isUserActive,
  roleHasPermission,
  type PermissionAction,
  type PermissionResource,
} from '@/lib/permissions'

export function usePermission(resource?: PermissionResource, action: PermissionAction = 'view') {
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth)

  const hasPermission = useCallback(
    (checkResource?: PermissionResource | string, checkAction: PermissionAction = 'view') => {
      if (!isAuthenticated || !user || !isUserActive(user.isActive)) return false
      const target = (checkResource ?? resource) as PermissionResource | undefined
      if (!target) return false
      return roleHasPermission(user.role, target, checkAction)
    },
    [isAuthenticated, resource, user]
  )

  const canAccess = useMemo(() => {
    if (!resource) return true
    return hasPermission(resource, action)
  }, [action, hasPermission, resource])

  return {
    hasPermission,
    canAccessPath: (pathname: string, pathAction: PermissionAction = 'view') =>
      Boolean(user) &&
      isUserActive(user?.isActive) &&
      canAccessPath(user?.role, pathname, pathAction),
    canAccess,
    isLoading,
    role: user?.role ?? null,
    isActive: isUserActive(user?.isActive),
  }
}
