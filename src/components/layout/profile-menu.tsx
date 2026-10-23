'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Building2, ChevronsUpDown, LogOut, Moon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import { useAppDispatch, useAppSelector } from '@/redux'
import { loadStockData } from '@/redux/slices'
import { readStoredAuthSession } from '@/lib/auth-session'
import { canAccessPath } from '@/lib/permissions'
import { ROUTES } from '@/lib/routes'
import { t } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { AdminUser } from '@/types'

/** Soft three-colour "mesh" avatar (same look as the LigaX profile tile). */
export function MeshAvatar({ name, className }: { name: string; className?: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold tracking-tight text-white',
        'shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_2px_8px_-3px_rgb(0_0_0/0.28)]',
        className ?? 'h-8 w-8'
      )}
      style={{
        backgroundColor: '#2b1a5e',
        backgroundImage:
          'radial-gradient(circle at 32% 30%, #8b3dff, transparent 58%), radial-gradient(circle at 74% 48%, #00c4b4, transparent 55%), radial-gradient(circle at 46% 82%, #c01a9c, transparent 52%)',
      }}
    >
      <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.28)]">{initials}</span>
    </span>
  )
}

interface ProfileMenuProps {
  collapsed?: boolean
  onSignOut: () => void
  onNavigate?: () => void
}

/**
 * Bottom-left account tile with the account menu: identity, notifications (stock alerts),
 * clinic settings (admins), dark mode switch and sign out.
 */
export function ProfileMenu({ collapsed = false, onSignOut, onNavigate }: ProfileMenuProps) {
  const dispatch = useAppDispatch()
  const { user: sessionUser, isAuthenticated, isLoading } = useAppSelector((s) => s.auth)
  const { alerts, stats, loading } = useAppSelector((s) => s.stock)
  const { resolvedTheme, setTheme } = useTheme()

  // Cached profile so the name/role are right on the very first paint.
  const [cachedUser, setCachedUser] = useState<AdminUser | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setCachedUser(readStoredAuthSession()?.user ?? null)
    setMounted(true)
  }, [])
  const user = sessionUser ?? cachedUser

  // Stock alerts are the app's notifications; load them once for the badge.
  useEffect(() => {
    if (isLoading || !isAuthenticated || stats || loading) return
    void dispatch(loadStockData())
  }, [dispatch, isAuthenticated, isLoading, stats, loading])

  const name = user?.name?.trim() || 'Account'
  const email = user?.email ?? ''
  const roleLabel = user?.role ? t(`roles.${user.role}`) : ''
  const alertCount = stats ? alerts.length : 0
  const canSeeSettings = canAccessPath(user?.role, ROUTES.settings, 'view')
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          // Expanded: the visible text names the button (WCAG 2.5.3); collapsed: icon only, so label it.
          aria-label={collapsed ? `${name}${roleLabel ? `, ${roleLabel}` : ''}. Account menu` : undefined}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl border border-border/50 bg-muted/40 p-1 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed && 'mx-auto h-10 w-10 justify-center p-0'
          )}
        >
          <span className="relative inline-flex shrink-0">
            <MeshAvatar name={name} className="h-8 w-8" />
            {alertCount > 0 && (
              <span
                role="status"
                aria-label={`${alertCount} notifications waiting`}
                className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground ring-2 ring-background"
              >
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold leading-snug text-foreground">{name}</span>
                <span className="block truncate text-xs leading-snug text-muted-foreground">{roleLabel}</span>
                <span className="sr-only">Account menu</span>
              </span>
              <ChevronsUpDown className="mr-1.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        align="end"
        sideOffset={12}
        className="flex w-[min(18rem,calc(100vw-1rem))] flex-col gap-0.5 rounded-[20px] border border-border bg-popover p-2 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
      >
        {email && <p className="truncate px-2.5 pb-0.5 pt-1.5 text-xs text-muted-foreground">{email}</p>}

        <div className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5">
          <MeshAvatar name={name} className="h-8 w-8" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-snug text-foreground">{name}</span>
            <span className="block truncate text-xs leading-snug text-muted-foreground">{roleLabel}</span>
          </span>
        </div>

        <DropdownMenuSeparator className="-mx-1 my-1 h-px shrink-0 bg-border/60" />

        <DropdownMenuLabel className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </DropdownMenuLabel>

        <DropdownMenuItem asChild className="min-h-8 cursor-pointer gap-2 rounded-xl px-2 py-1.5 text-[13px]">
          <Link href={ROUTES.inventory} onClick={onNavigate}>
            <Bell className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="flex-1">Notifications</span>
            {alertCount > 0 && (
              <span
                aria-label={`${alertCount} waiting`}
                className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary"
              >
                {alertCount}
              </span>
            )}
          </Link>
        </DropdownMenuItem>

        {canSeeSettings && (
          <DropdownMenuItem asChild className="min-h-8 cursor-pointer gap-2 rounded-xl px-2 py-1.5 text-[13px]">
            <Link href={ROUTES.settings} onClick={onNavigate}>
              <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="flex-1">Clinic settings</span>
            </Link>
          </DropdownMenuItem>
        )}

        {/* Keep the menu open while toggling the theme. */}
        <DropdownMenuItem
          className="min-h-8 cursor-pointer gap-2 rounded-xl px-2 py-1.5 text-[13px]"
          onSelect={(event) => {
            event.preventDefault()
            setTheme(isDark ? 'light' : 'dark')
          }}
        >
          <Moon className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="flex-1">Dark mode</span>
          <span
            role="switch"
            aria-checked={isDark}
            aria-label="Dark mode"
            className="inline-flex shrink-0 items-center rounded-full transition-colors"
            style={{
              width: 44,
              height: 24,
              padding: 2,
              backgroundColor: isDark ? 'hsl(var(--primary))' : 'hsl(var(--input))',
              justifyContent: isDark ? 'flex-end' : 'flex-start',
            }}
          >
            <span
              className="block rounded-full bg-background shadow"
              style={{ width: 20, height: 20 }}
            />
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="-mx-1 my-1 h-px shrink-0 bg-border/60" />

        <DropdownMenuItem
          className="min-h-8 cursor-pointer gap-2 rounded-xl px-2 py-1.5 text-[13px] text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() => onSignOut()}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
