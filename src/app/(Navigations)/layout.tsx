'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/redux'
import { logout, setMobileSidebarOpen } from '@/redux/slices'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminHeader } from '@/components/layout/admin-header'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { LoadingScreen } from '@/components'
import {
  canAccessPath,
  getDefaultAccessiblePath,
  getResourceForPath,
  isUserActive,
} from '@/lib/permissions'

export default function NavigationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, isLoggingOut, user } = useAppSelector((s) => s.auth)
  const { mobileSidebarOpen } = useAppSelector((s) => s.ui)
  const redirectingRef = useRef(false)

  const resource = getResourceForPath(pathname)
  const accountActive = isUserActive(user?.isActive)
  const hasRouteAccess = Boolean(user) && accountActive && canAccessPath(user?.role, pathname, 'view')

  useEffect(() => {
    if (isLoggingOut || isLoading) return
    if (!isAuthenticated) {
      router.replace('/')
    }
  }, [isLoading, isAuthenticated, isLoggingOut, router])

  useEffect(() => {
    if (isLoading || isLoggingOut || !isAuthenticated || !user || redirectingRef.current) return

    if (!accountActive) {
      redirectingRef.current = true
      toast.error('This account has been disabled')
      void dispatch(logout()).finally(() => {
        window.location.assign('/')
      })
      return
    }

    if (hasRouteAccess) {
      redirectingRef.current = false
      return
    }

    if (!resource) return

    redirectingRef.current = true
    toast.error("You don't have permission to access this page")

    const fallbackPath = getDefaultAccessiblePath(user.role)
    if (fallbackPath !== '/' && fallbackPath !== pathname) {
      router.replace(fallbackPath)
      redirectingRef.current = false
      return
    }

    void dispatch(logout()).finally(() => {
      window.location.assign('/')
    })
  }, [
    accountActive,
    dispatch,
    hasRouteAccess,
    isAuthenticated,
    isLoading,
    isLoggingOut,
    pathname,
    resource,
    router,
    user,
  ])

  if (isLoggingOut) {
    return <LoadingScreen message={'Signing out...'} />
  }

  if (isLoading) return <LoadingScreen message={'Loading portal'} />

  if (!isAuthenticated) return null

  if (!hasRouteAccess) {
    return <LoadingScreen message="Checking access..." />
  }

  return (
    <div className="min-h-screen flex bg-muted/30 dark:bg-background">
      <div className="hidden md:flex h-screen shrink-0 sticky top-0">
        <AdminSidebar />
      </div>
      <Sheet open={mobileSidebarOpen} onOpenChange={(o) => dispatch(setMobileSidebarOpen(o))}>
        <SheetContent side="left" className="h-full w-[252px] overflow-hidden border-r p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation menu</SheetTitle>
            <SheetDescription>Main application navigation links.</SheetDescription>
          </SheetHeader>
          <AdminSidebar mobile />
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
