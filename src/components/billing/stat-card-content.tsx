'use client'

import type { LucideIcon } from 'lucide-react'
import { metricAccents, type MetricAccentKey } from '@/utils/theme'
import { CLINIC_CURRENCY_SYMBOL } from '@/lib/patient-stats'

interface StatCardContentProps {
  title: string
  badge: string
  icon: LucideIcon
  accent: MetricAccentKey
  /** Undefined or loading -> the value renders as a skeleton block; everything else is static. */
  value?: number
  loading?: boolean
  currency?: boolean
}

/** Same markup as AnimatedStat, but static parts paint immediately and only the value waits for data. */
export function StatCardContent({
  title,
  badge,
  icon: Icon,
  accent,
  value,
  loading,
  currency,
}: StatCardContentProps) {
  const accentMeta = metricAccents[accent]
  return (
    <div
      className="metric-stat metric-stat-compact"
      style={{ '--stat-accent': `var(${accentMeta.cssVar})` } as React.CSSProperties}
      aria-busy={loading || undefined}
    >
      <div className="metric-stat-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
        {loading || value === undefined ? (
          <div className="h-6 w-14 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className="metric-stat-value text-xl font-bold leading-tight tabular-nums tracking-tight">
            {currency ? CLINIC_CURRENCY_SYMBOL : ''}
            {value.toLocaleString('en-IN')}
          </p>
        )}
      </div>
      <span className="metric-stat-badge hidden self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider 2xl:inline-flex">
        {badge}
      </span>
    </div>
  )
}
