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
      className="metric-stat metric-stat-compact"
      style={{ '--stat-accent': `var(${meta.cssVar})` } as React.CSSProperties}
    >
      <div className="metric-stat-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
        <div aria-busy={value === null || undefined}>
          {value === null ? (
            <Sk className="h-6 w-14" />
          ) : (
            <p className="metric-stat-value text-xl font-bold leading-tight tabular-nums tracking-tight">
              {currency ? CLINIC_CURRENCY_SYMBOL : ''}
              {value.toLocaleString('en-IN')}
            </p>
          )}
        </div>
      </div>
      {tag !== '' && (
        <span className="metric-stat-badge hidden self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider 2xl:inline-flex">
          {tag}
        </span>
      )}
    </div>
  )
}
