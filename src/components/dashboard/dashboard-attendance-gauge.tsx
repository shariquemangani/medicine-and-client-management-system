'use client'

interface DashboardAttendanceGaugeProps {
  rate: number
}

export function DashboardStockGauge(props: DashboardAttendanceGaugeProps) {
  return <DashboardAttendanceGauge {...props} />
}

export function DashboardAttendanceGauge({ rate }: DashboardAttendanceGaugeProps) {
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (rate / 100) * circumference

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {"Today's Inventory"}
      </p>
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
          <span className="text-3xl font-bold tabular-nums text-foreground">{rate}%</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Present
          </span>
        </div>
      </div>
      <p className="mt-4 max-w-[180px] text-xs leading-relaxed text-muted-foreground">
        {rate >= 90
          ? 'Excellent attendance across all active classes.'
          : 'Attendance needs attention in some sections.'}
      </p>
    </div>
  )
}
