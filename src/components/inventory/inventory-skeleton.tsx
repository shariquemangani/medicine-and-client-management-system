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
      className="metric-stat metric-stat-compact"
      style={{ '--stat-accent': `var(${meta.cssVar})` } as React.CSSProperties}
      aria-busy="true"
    >
      <div className="metric-stat-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
        <div className="h-6 w-14 animate-pulse rounded-md bg-muted" />
      </div>
      {tag !== '' && (
        <span className="metric-stat-badge hidden self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider 2xl:inline-flex">
          {tag}
        </span>
      )}
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
