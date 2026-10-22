'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Package, UserPlus, Wallet } from 'lucide-react'
import { t } from '@/lib/labels'
import { ROUTES } from '@/lib/routes'

const links = [
  {
    href: ROUTES.patientsNew,
    labelKey: 'patients.addPatient',
    icon: UserPlus,
    accent: '--metric-patients',
  },
  {
    href: ROUTES.inventory,
    labelKey: 'nav.inventory',
    icon: Package,
    accent: '--metric-inventory',
  },
  {
    href: ROUTES.vaultMedicine,
    labelKey: 'nav.medicines',
    icon: BookOpen,
    accent: '--metric-medicines',
  },
  {
    href: ROUTES.billing,
    labelKey: 'nav.billing',
    icon: Wallet,
    accent: '--metric-billing',
  },
]

export function DashboardQuickActions() {
  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{'Quick Actions'}</h3>
      <div className="grid flex-1 grid-cols-2 gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="dashboard-quick-link group flex items-center gap-2.5 rounded-xl p-3 transition-all"
            style={{ '--qa-accent': `var(${link.accent})` } as React.CSSProperties}
          >
            <div className="dashboard-quick-link-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <link.icon className="h-4 w-4" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">{t(link.labelKey)}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  )
}
