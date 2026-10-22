'use client'

import type { LucideIcon } from 'lucide-react'
import { metricAccents, type MetricAccentKey } from '@/utils/theme'
import { CLINIC_CURRENCY_SYMBOL } from '@/lib/patient-stats'
import { Sk } from './skeleton-bits'

interface DashboardStatTileProps {
  title: string
  value: number | null
  icon: LucideIcon
  accent: MetricAccentKey
  badge?: string
  currency?: boolean
}

/** Same look as AnimatedStat, but the value alone shows a skeleton while null. */
export function DashboardStatTile({ title, value, icon: Icon, accent, badge, currency }: DashboardStatTileProps) {
  const meta = metricAccents[accent]
  const tag = badge ?? meta.label
  return (
    <div
      className="metric-stat flex h-full flex-col gap-2.5"
      style={{ '--stat-accent': `var(${meta.cssVar})` } as React.CSSProperties}
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
        <div className="mt-1" aria-busy={value === null || undefined}>
          {value === null ? (
            <Sk className="h-8 w-16 sm:h-9" />
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
