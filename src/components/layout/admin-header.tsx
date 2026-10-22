'use client'

import { useEffect, useMemo, useState, Fragment } from 'react'
import { readStoredAuthSession } from '@/lib/auth-session'
import type { AdminUser } from '@/types'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/redux'
import { toggleMobileSidebar } from '@/redux/slices'
import { ModeToggle } from '@/components/mode-toggle'
import { StockAlertsBell } from '@/components/layout/stock-alerts-bell'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getAdminBreadcrumbSegments } from '@/lib/admin-breadcrumbs'
import { t } from '@/lib/labels'

export function AdminHeader() {
  const pathname = usePathname()
  const { user: sessionUser } = useAppSelector((s) => s.auth)
  // Cached profile so the name/role do not pop in after the session check.
  const [cachedUser, setCachedUser] = useState<AdminUser | null>(null)
  useEffect(() => {
    setCachedUser(readStoredAuthSession()?.user ?? null)
  }, [])
  const user = sessionUser ?? cachedUser
  const breadcrumbOverrides = useAppSelector((s) => s.ui.breadcrumbOverrides)
  const dispatch = useAppDispatch()
  const segments = useMemo(
    () => breadcrumbOverrides ?? getAdminBreadcrumbSegments(pathname),
    [breadcrumbOverrides, pathname]
  )
  const initial = user?.name?.charAt(0).toUpperCase() ?? 'A'
  const roleKey = user?.role ? `roles.${user.role}` : 'roles.admin'

  return (
    <header className="sticky top-0 z-20 glass-panel border-b border-[hsl(var(--glass-border))] rounded-none">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => dispatch(toggleMobileSidebar())}
            aria-label={'Open menu'}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-wrap gap-y-1">
              {segments.map((segment, index) => {
                const isLast = index === segments.length - 1
                const label =
                  segment.label ??
                  (segment.labelKey ? t(segment.labelKey as 'nav.dashboard') : '')

                return (
                  <Fragment key={`${segment.label ?? segment.labelKey}-${index}`}>
                    <BreadcrumbItem className="min-w-0">
                      {isLast ? (
                        <BreadcrumbPage className="truncate text-lg font-semibold tracking-tight text-foreground">
                          {label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          asChild
                          className="truncate text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Link href={segment.href ?? '#'}>{label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && (
                      <BreadcrumbSeparator className="text-muted-foreground/60 [&>svg]:h-3.5 [&>svg]:w-3.5" />
                    )}
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <StockAlertsBell />
          <ModeToggle />
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {initial}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground leading-none">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{t(roleKey)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
