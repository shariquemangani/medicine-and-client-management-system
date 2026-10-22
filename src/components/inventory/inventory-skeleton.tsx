'use client'

import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Boxes, IndianRupee, Timer } from 'lucide-react'
import { BentoCard } from '@/components/shared'
import { metricAccents, type MetricAccentKey } from '@/utils/theme'
import { t } from '@/lib/labels'

/** Stat tile whose title, icon and tag are static; only the number is a skeleton. */
export function PendingStat({
  title,
  badge,
  icon: Icon,
  accent,
}: {
  title: string
  badge?: string
  icon: LucideIcon
  accent: MetricAccentKey
}) {
  const meta = metricAccents[accent]
  const tag = badge ?? meta.label
  return (
    <div
      className="metric-stat flex h-full flex-col gap-2.5"
      style={{ '--stat-accent': `var(${meta.cssVar})` } as React.CSSProperties}
      aria-busy="true"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="metric-stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5" />
        </div>
        {tag !== '' && (
          <span className="metric-stat-badge rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {tag}
          </span>
        )}
      </div>
      <div className="mt-auto">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className="mt-1 flex h-9 items-end">
          <div className="animate-pulse h-8 w-16 rounded-md bg-muted" />
        </div>
      </div>
    </div>
  )
}

/** Same four cards as InventoryStatsCards, with the numbers pending. */
export function InventoryStatSkeleton() {
  return (
    <>
      <BentoCard colSpan={3} accent="inventory" delay={0}>
        <PendingStat title={t('inventory.statSkus')} badge="Items" icon={Boxes} accent="inventory" />
      </BentoCard>
      <BentoCard colSpan={3} accent="medicines" delay={0}>
        <PendingStat title={t('inventory.statValue')} badge="Value" icon={IndianRupee} accent="medicines" />
      </BentoCard>
      <BentoCard colSpan={3} accent="fees" delay={0}>
        <PendingStat title={t('inventory.statLowStock')} badge="Alerts" icon={AlertTriangle} accent="fees" />
      </BentoCard>
      <BentoCard colSpan={3} accent="prescriptions" delay={0}>
        <PendingStat title={t('inventory.statExpiring')} badge="Expiry" icon={Timer} accent="prescriptions" />
      </BentoCard>
    </>
  )
}

export function InventoryRowsSkeleton({ rows = 5, className = 'h-16' }: { rows?: number; className?: string }) {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`animate-pulse w-full rounded-md bg-muted ${className}`} />
      ))}
    </div>
  )
}

/** Retained for compatibility; the page no longer returns it. */
export function InventoryPageSkeleton() {
  return (
    <div className="inventory-page dashboard-shell space-y-4" aria-busy="true">
      <div className="dashboard-skeleton h-28 rounded-2xl" />
      <div className="dashboard-skeleton h-96 rounded-2xl" />
    </div>
  )
}
