'use client'

import { Activity } from 'lucide-react'
import { CardHeader } from '@/components/shared/card-header'
import { Sk } from './skeleton-bits'

interface DashboardAttendanceGaugeProps {
  /** Percent of stock items above their reorder level; null when no stock is tracked. */
  rate: number | null
  loading?: boolean
}

export function DashboardStockGauge(props: DashboardAttendanceGaugeProps) {
  return <DashboardAttendanceGauge {...props} />
}

export function DashboardAttendanceGauge({ rate, loading = false }: DashboardAttendanceGaugeProps) {
  const circumference = 2 * Math.PI * 54
  const value = loading ? 0 : (rate ?? 0)
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex h-full flex-col items-center justify-center text-center" aria-busy={loading || undefined}>
      <CardHeader
        className="w-full text-left"
        title="Stock Health"
        description="Items above reorder level"
        icon={Activity}
        accent="patients"
        ornament={false}
      />
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            className="opacity-40"
          />
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke="hsl(var(--metric-attendance))"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="dashboard-gauge-ring transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <Sk className="h-8 w-14" />
          ) : (
            <span className="text-3xl font-bold tabular-nums text-foreground">{rate === null ? '—' : `${rate}%`}</span>
          )}
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            In stock
          </span>
        </div>
      </div>
      {loading ? (
        <Sk className="mt-4 h-8 w-[180px]" />
      ) : (
      <p className="mt-4 max-w-[180px] text-xs leading-relaxed text-muted-foreground">
        {rate === null
          ? 'No stock tracked yet. Receive stock in Inventory to see health.'
          : rate >= 90
            ? 'Stock levels look healthy across all medicines.'
            : 'Some medicines are at or below their reorder level.'}
      </p>
      )}
    </div>
  )
}
