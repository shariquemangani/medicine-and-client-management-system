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
      className="metric-stat flex h-full flex-col gap-2.5"
      style={{ '--stat-accent': `var(${accentMeta.cssVar})` } as React.CSSProperties}
      aria-busy={loading || undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="metric-stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5" />
        </div>
        <span className="metric-stat-badge rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
          {badge}
        </span>
      </div>
      <div className="mt-auto">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          {loading || value === undefined ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted sm:h-9" />
          ) : (
            <p className="metric-stat-value text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
              {currency ? CLINIC_CURRENCY_SYMBOL : ''}
              {value.toLocaleString('en-IN')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
