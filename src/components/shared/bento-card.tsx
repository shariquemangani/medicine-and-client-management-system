'use client'

import { cn } from '@/lib/utils'
import type { MetricAccentKey } from '@/utils/theme'

type BentoSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

interface BentoCardProps {
  children: React.ReactNode
  className?: string
  colSpan?: BentoSpan
  rowSpan?: 1 | 2 | 3
  accent?: MetricAccentKey
  /** @deprecated Use `accent` instead */
  accentColor?: string
  onClick?: () => void
  delay?: number
}

const colSpanMap: Record<BentoSpan, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
}

const rowSpanMap: Record<1 | 2 | 3, string> = {
  1: 'lg:row-span-1',
  2: 'lg:row-span-2',
  3: 'lg:row-span-3',
}

const accentVarMap: Record<MetricAccentKey, string> = {
  patients: '--metric-patients',
  staff: '--metric-teachers',
  medicines: '--metric-classes',
  fees: '--metric-fees',
  inventory: '--metric-attendance',
  prescriptions: '--metric-exams',
}

export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  accent,
  onClick,
  delay = 0,
}: BentoCardProps) {
  const accentVar = accent ? accentVarMap[accent] : undefined

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      className={cn(
        'bento-card-premium group relative rounded-2xl',
        'transition-all duration-300 ease-out',
        'dashboard-bento-enter',
        colSpanMap[colSpan],
        rowSpanMap[rowSpan],
        onClick && 'cursor-pointer',
        className
      )}
      style={
        {
          '--bento-accent': accentVar ? `var(${accentVar})` : undefined,
          animationDelay: `${delay}ms`,
        } as React.CSSProperties
      }
    >
      {accentVar && <div className="bento-card-accent-orb" aria-hidden />}
      <div className="bento-card-premium-inner relative z-10 h-full p-4">
        {children}
      </div>
    </div>
  )
}
