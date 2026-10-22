'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/redux'
import { logout, setMobileSidebarOpen } from '@/redux/slices'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PageSkeleton } from '@/components/shared/page-skeleton'
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

  // Signed out (and not mid-sign-in/out): the redirect effect is already running.
  if (!isLoading && !isLoggingOut && !isAuthenticated) return null

  // The app shell (sidebar, header) is static and always paints immediately; only the page
  // area shows a skeleton while the session or access check resolves.
  // While the session is still being resolved the real page renders right away (its static parts
  // are always visible and its data areas show their own skeletons). A generic placeholder is only
  // used when access is actually denied or the user is signing out.
  const pending = !isLoading && (isLoggingOut || !hasRouteAccess)

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
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => dispatch(setMobileSidebarOpen(true))}
        className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto p-4 pt-16 md:p-6">{pending ? <PageSkeleton label="Loading page" /> : children}</main>
      </div>
    </div>
  )
}
