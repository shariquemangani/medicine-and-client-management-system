'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { usePermission } from '@/hooks/use-permission'
import { useAppDispatch, useAppSelector } from '@/redux'
import { logout } from '@/redux/slices'
import type { Permission } from '@/types'
import { getDefaultAccessiblePath } from '@/lib/permissions'

interface PermissionGuardProps {
  resource: Permission['resource']
  action?: Permission['action']
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({
  resource,
  action = 'view',
  children,
  fallback,
}: PermissionGuardProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { hasPermission } = usePermission()
  const { isAuthenticated, isLoading, isLoggingOut, user } = useAppSelector((state) => state.auth)
  const redirectedRef = useRef(false)

  const hasAccess = hasPermission(resource, action)

  useEffect(() => {
    if (isLoading || isLoggingOut || redirectedRef.current) return

    if (!isAuthenticated) {
      redirectedRef.current = true
      router.replace('/')
      return
    }

    if (!hasAccess) {
      redirectedRef.current = true
      toast.error(`You don't have permission to ${action} ${resource}`)
      const fallbackPath = getDefaultAccessiblePath(user?.role)
      if (fallbackPath !== '/') {
        router.replace(fallbackPath)
        return
      }
      void dispatch(logout()).finally(() => {
        window.location.assign('/')
      })
    }
  }, [
    action,
    dispatch,
    hasAccess,
    isAuthenticated,
    isLoading,
    isLoggingOut,
    resource,
    router,
    user?.role,
  ])

  if (isLoading || isLoggingOut) {
    return fallback ?? null
  }

  if (!isAuthenticated || !hasAccess) {
    return fallback ?? null
  }

  return <>{children}</>
}
