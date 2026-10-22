'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/redux'
import { toggleSidebar, setMobileSidebarOpen, setSidebarCollapsed, logout } from '@/redux/slices'
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  BookOpen,
  FileText,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Package,
} from 'lucide-react'
import { AdminSidebarVaultNav } from '@/components/layout/admin-sidebar-vault-nav'
import { AdminSidebarNavLink } from '@/components/layout/admin-sidebar-nav-link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useState, useEffect, useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { canAccessPath } from '@/lib/permissions'
import { t } from '@/lib/labels'
import { readStoredAuthSession } from '@/lib/auth-session'
import { ROUTES } from '@/lib/routes'

type NavAccent =
  | '--metric-patients'
  | '--metric-teachers'
  | '--metric-classes'
  | '--metric-attendance'
  | '--metric-exams'
  | '--metric-fees'
  | '--primary'

interface NavItem {
  href: string
  labelKey: string
  icon: LucideIcon
  accent: NavAccent
  vault?: boolean
}

interface NavGroup {
  titleKey: string
  items: NavItem[]
}

const navGroupsConfig: NavGroup[] = [
  {
    titleKey: 'nav.overview',
    items: [
      {
        href: ROUTES.dashboard,
        labelKey: 'nav.dashboard',
        icon: LayoutDashboard,
        accent: '--metric-patients',
      },
    ],
  },
  {
    titleKey: 'nav.people',
    items: [
      {
        href: ROUTES.patients,
        labelKey: 'nav.patients',
        icon: Users,
        accent: '--metric-patients',
      },
    ],
  },
  {
    titleKey: 'nav.operations',
    items: [
      {
        href: ROUTES.vaultMedicine,
        labelKey: 'nav.medicines',
        icon: BookOpen,
        accent: '--metric-classes',
        vault: true,
      },
      {
        href: ROUTES.inventory,
        labelKey: 'nav.inventory',
        icon: Package,
        accent: '--metric-attendance',
      },
      {
        href: ROUTES.prescriptions,
        labelKey: 'nav.prescriptions',
        icon: FileText,
        accent: '--metric-exams',
      },
    ],
  },
  {
    titleKey: 'nav.finance',
    items: [
      {
        href: ROUTES.billing,
        labelKey: 'nav.billing',
        icon: Wallet,
        accent: '--metric-fees',
      },
    ],
  },
  {
    titleKey: 'nav.system',
    items: [
      {
        href: ROUTES.settings,
        labelKey: 'nav.settings',
        icon: Settings,
        accent: '--primary',
      },
    ],
  },
]

interface AdminSidebarProps {
  mobile?: boolean
}

export function AdminSidebar({ mobile }: AdminSidebarProps) {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { sidebarCollapsed } = useAppSelector((s) => s.ui)
  const { user, isLoggingOut } = useAppSelector((s) => s.auth)
  const collapsed = mobile ? false : sidebarCollapsed
  const [logoutOpen, setLogoutOpen] = useState(false)
  // Cached role keeps the right menu items on the first paint, before the session is verified.
  const [cachedRole, setCachedRole] = useState<string | null>(null)
  useEffect(() => {
    setCachedRole(readStoredAuthSession()?.user.role ?? null)
  }, [])
  const effectiveRole = user?.role ?? cachedRole

  const navGroups = useMemo(
    () =>
      navGroupsConfig
        .map((group) => ({
          title: t(group.titleKey),
          items: group.items
            .filter((item) => canAccessPath(effectiveRole, item.href, 'view'))
            .map((item) => ({
              ...item,
              label: t(item.labelKey),
            })),
        }))
        .filter((group) => group.items.length > 0),
    [user?.isActive, effectiveRole]
  )

  const initial = user?.name?.charAt(0).toUpperCase() ?? 'A'
  const roleKey = user?.role ? `roles.${user.role}` : 'roles.admin'

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved === 'true') dispatch(setSidebarCollapsed(true))
  }, [dispatch])

  useEffect(() => {
    if (!mobile) {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
    }
  }, [sidebarCollapsed, mobile])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setLogoutOpen(false)
    try {
      await dispatch(logout()).unwrap()
    } catch {
      // Patient session is cleared in logout.rejected — still redirect
    }
    window.location.assign('/')
  }

  const handleNavClick = () => {
    if (mobile) dispatch(setMobileSidebarOpen(false))
  }

  return (
    <aside
      className={cn(
        'admin-sidebar relative flex h-full flex-col overflow-hidden transition-[width] duration-200 ease-out',
        collapsed ? 'w-[76px]' : 'w-[252px]'
      )}
    >
      <div className="admin-sidebar-corner-glow pointer-events-none" aria-hidden />

      <div
        className={cn(
          'relative z-10 flex shrink-0 gap-2 p-3 pb-2',
          collapsed ? 'flex-col items-center' : 'flex-row items-center justify-between'
        )}
      >
        <div className={cn('flex min-w-0 items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="admin-sidebar-logo relative flex h-10 w-10 shrink-0 items-center justify-center">
            <div className="admin-sidebar-logo-ring" aria-hidden />
            <div className="admin-sidebar-logo-core">
              <Stethoscope className="h-5 w-5 text-white" strokeWidth={1.75} />
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-foreground">{'MediFlow'}</p>
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-2.5 w-2.5 text-primary" />
                {effectiveRole === 'staff' ? 'Staff' : 'Admin'}
              </p>
            </div>
          )}
        </div>
        {!mobile && (
          <button
            type="button"
            onClick={() => dispatch(toggleSidebar())}
            className="admin-sidebar-collapse flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="relative z-10 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden px-2 py-1">
        {navGroups.map((group) => (
          <div key={group.title} className="shrink-0">
            {!collapsed && (
              <p className="admin-sidebar-group-label px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                if (item.vault) {
                  return (
                    <li key="vault-nav">
                      <AdminSidebarVaultNav
                        pathname={pathname}
                        collapsed={collapsed}
                        role={user?.role}
                        onNavClick={handleNavClick}
                      />
                    </li>
                  )
                }

                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <AdminSidebarNavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      accent={item.accent}
                      isActive={isActive}
                      collapsed={collapsed}
                      onClick={handleNavClick}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative z-10 shrink-0 space-y-2 border-t border-[hsl(var(--glass-border))] p-3">
        {!collapsed && user && (
          <div className="admin-sidebar-user flex items-center gap-2.5 rounded-xl px-2.5 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{t(roleKey)}</p>
            </div>
            <span className="admin-sidebar-online-dot" title={'Online'} />
          </div>
        )}

        <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={isLoggingOut}
              className={cn(
                'admin-sidebar-logout flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isLoggingOut && 'pointer-events-none opacity-60'
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <LogOut className="h-[18px] w-[18px]" />
              </span>
              {!collapsed && <span>{'Logout'}</span>}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{'Confirm logout'}</AlertDialogTitle>
              <AlertDialogDescription>{'You will be redirected to the login page.'}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{'Cancel'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isLoggingOut ? 'Signing out...' : 'Logout'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  )
}
