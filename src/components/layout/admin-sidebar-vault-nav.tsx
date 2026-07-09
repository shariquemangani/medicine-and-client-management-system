'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, BookOpen, Flag, Pill, Sparkles, type LucideIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  AdminSidebarNavLink,
  AdminSidebarNavTrigger,
  type SidebarNavAccent,
} from '@/components/layout/admin-sidebar-nav-link'
import { t } from '@/lib/labels'
import { ROUTES } from '@/lib/routes'
import { canAccessPath } from '@/lib/permissions'
import type { UserRole } from '@/types'

interface VaultChildConfig {
  href: string
  labelKey: string
  icon: LucideIcon
  accent: SidebarNavAccent
}

const vaultChildrenConfig: VaultChildConfig[] = [
  {
    href: ROUTES.vaultMedicine,
    labelKey: 'medicines.vaultCardMedicine',
    icon: Pill,
    accent: '--metric-classes',
  },
  {
    href: ROUTES.vaultDiseases,
    labelKey: 'medicines.vaultCardDiseases',
    icon: Activity,
    accent: '--metric-teachers',
  },
  {
    href: ROUTES.vaultFlags,
    labelKey: 'medicines.vaultCardFlags',
    icon: Flag,
    accent: '--metric-exams',
  },
]

interface AdminSidebarVaultNavProps {
  pathname: string
  collapsed: boolean
  role?: UserRole | string | null
  onNavClick: () => void
}

function isVaultPath(pathname: string) {
  return pathname === ROUTES.vault || pathname.startsWith(`${ROUTES.vault}/`)
}

function isChildActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminSidebarVaultNav({
  pathname,
  collapsed,
  role,
  onNavClick,
}: AdminSidebarVaultNavProps) {
  const children = useMemo(
    () =>
      vaultChildrenConfig
        .filter((item) => canAccessPath(role, item.href, 'view'))
        .map((item) => ({
          ...item,
          label: t(item.labelKey),
        })),
    [role]
  )

  const vaultActive = isVaultPath(pathname)
  const [open, setOpen] = useState(vaultActive)
  const [popoverOpen, setPopoverOpen] = useState(false)

  useEffect(() => {
    if (vaultActive) setOpen(true)
  }, [vaultActive])

  if (children.length === 0) return null

  const childLinks = children.map((item) => (
    <AdminSidebarNavLink
      key={item.href}
      href={item.href}
      label={item.label}
      icon={item.icon}
      accent={item.accent}
      isActive={isChildActive(pathname, item.href)}
      collapsed={collapsed}
      variant="child"
      onClick={() => {
        onNavClick()
        setPopoverOpen(false)
      }}
    />
  ))

  if (collapsed) {
    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <AdminSidebarNavTrigger
            label={t('nav.medicines')}
            icon={BookOpen}
            accent="--metric-classes"
            isActive={vaultActive}
            collapsed
            aria-expanded={popoverOpen}
          />
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          className="admin-sidebar-vault-popover w-56 border-0 p-2"
        >
          <p className="admin-sidebar-vault-popover-label px-2 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
            <Sparkles className="mr-1 inline h-2.5 w-2.5" />
            {t('nav.medicines')}
          </p>
          <div className="space-y-0.5">{childLinks}</div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="admin-sidebar-vault-group">
      <CollapsibleTrigger asChild>
        <AdminSidebarNavTrigger
          label={t('nav.medicines')}
          icon={BookOpen}
          accent="--metric-classes"
          isActive={vaultActive}
          open={open}
          showChevron
          aria-expanded={open}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="admin-sidebar-vault-panel overflow-hidden">
        <div className="admin-sidebar-vault-rail relative ml-5 mr-1 mt-0.5 space-y-0.5 pb-0.5 pl-3 pt-1">
          <span className="admin-sidebar-vault-rail-line pointer-events-none" aria-hidden />
          {childLinks}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
