import { LucideIcon, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { metricAccents, type MetricAccentKey } from '@/utils/theme'
import { CLINIC_CURRENCY_SYMBOL } from '@/lib/patient-stats'

interface AnimatedStatProps {
  title: string
  value: number
  icon: LucideIcon
  accent: MetricAccentKey
  subtitle?: string
  /** Overrides the accent's default tag text; pass an empty string to hide the tag. */
  badge?: string
  prefix?: string
  suffix?: string
  /** When true, prefixes the value with ₹ (Indian Rupee). */
  currency?: boolean
  trend?: number
  compact?: boolean
}

export function AnimatedStat({
  title,
  value,
  icon: Icon,
  accent,
  subtitle,
  badge,
  prefix,
  suffix = '',
  currency = false,
  trend,
}: AnimatedStatProps) {
  const display = value
  const accentMeta = metricAccents[accent]
  const resolvedPrefix = prefix ?? (currency ? CLINIC_CURRENCY_SYMBOL : '')


  return (
    <div
      className="metric-stat metric-stat-compact"
      style={{ '--stat-accent': `var(${accentMeta.cssVar})` } as React.CSSProperties}
    >
      <div className="metric-stat-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
        {subtitle && <p className="truncate text-[11px] text-muted-foreground/70">{subtitle}</p>}
        <div className="flex items-end gap-2">
          <p className="metric-stat-value text-xl font-bold leading-tight tabular-nums tracking-tight">
            {resolvedPrefix}
            {display.toLocaleString('en-IN')}
            {suffix}
          </p>
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                trend >= 0
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/15 text-red-600 dark:text-red-400'
              )}
            >
              <TrendingUp className={cn('h-3 w-3', trend < 0 && 'rotate-180')} />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      {(badge ?? accentMeta.label) !== '' && (
        <span className="metric-stat-badge hidden self-start rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider 2xl:inline-flex">
          {badge ?? accentMeta.label}
        </span>
      )}
    </div>
  )
}
