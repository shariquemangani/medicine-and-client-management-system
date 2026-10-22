'use client'


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
  compact = false,
}: AnimatedStatProps) {
  const display = value
  const accentMeta = metricAccents[accent]
  const resolvedPrefix = prefix ?? (currency ? CLINIC_CURRENCY_SYMBOL : '')


  return (
    <div
      className={cn('metric-stat flex h-full flex-col', compact ? 'gap-2.5' : 'gap-3')}
      style={{ '--stat-accent': `var(${accentMeta.cssVar})` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="metric-stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5" />
        </div>
        {(badge ?? accentMeta.label) !== '' && (
          <span className="metric-stat-badge rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {badge ?? accentMeta.label}
          </span>
        )}
      </div>

      <div className="mt-auto">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{subtitle}</p>}
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="metric-stat-value text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
            {resolvedPrefix}
            {display.toLocaleString('en-IN')}
            {suffix}
          </p>
          {trend !== undefined && (
            <span
              className={cn(
                'mb-1 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
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
    </div>
  )
}
