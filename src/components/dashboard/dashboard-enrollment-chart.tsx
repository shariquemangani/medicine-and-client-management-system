'use client'

import type { EnrollmentTrend } from '@/types'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface DashboardPatientTrendChartProps {
  data: EnrollmentTrend[]
}

export function DashboardPatientTrendChart({ data }: DashboardPatientTrendChartProps) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="enrollmentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--metric-patients))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--metric-patients))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--metric-patients))"
            strokeWidth={2.5}
            fill="url(#enrollmentFill)"
            isAnimationActive={false}
            dot={{ fill: 'hsl(var(--metric-patients))', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="dashboard-chart-tooltip rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-[hsl(var(--metric-patients-text))]">
        {payload[0].value} patients
      </p>
    </div>
  )
}
