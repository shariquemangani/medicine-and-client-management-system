'use client'

import dynamic from 'next/dynamic'
import type { EnrollmentTrend } from '@/types'
import { Sk } from './skeleton-bits'

const Chart = dynamic(() => import('./dashboard-enrollment-chart').then((m) => m.DashboardPatientTrendChart), {
  ssr: false,
  loading: () => <Sk className="h-full min-h-[200px] w-full" />,
})

/** Card title/subtitle are static; only the badge and chart body wait for data. */
export function DashboardTrendCard({ data }: { data: EnrollmentTrend[] | null }) {
  const added = data && data.length > 1 ? data[data.length - 1].count - data[0].count : 0
  return (
    <div className="flex h-full min-h-[240px] flex-col" aria-busy={data === null || undefined}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{'Patient Growth'}</h3>
          <p className="text-xs text-muted-foreground">{'Active patients over 6 months'}</p>
        </div>
        {data === null ? (
          <Sk className="h-5 w-16 rounded-full" />
        ) : (
          <span className="rounded-full bg-[hsl(var(--metric-patients)/0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--metric-patients))]">
            {`${added >= 0 ? '+' : ''}${added} in 6 mo`}
          </span>
        )}
      </div>
      <div className="min-h-[200px] flex-1">
        {data === null ? <Sk className="h-full min-h-[200px] w-full" /> : <Chart data={data} />}
      </div>
    </div>
  )
}
