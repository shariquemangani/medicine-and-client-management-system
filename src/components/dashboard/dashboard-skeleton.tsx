'use client'

import { bentoGridClass } from '@/utils/theme'

const statCol = 'lg:col-span-3 rounded-2xl border border-border/40 p-4 sm:p-5'

export function DashboardSkeleton() {
  return (
    <div
      className="dashboard-shell space-y-4"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="dashboard-skeleton h-28 rounded-2xl" />
      <div className={bentoGridClass}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={statCol}>
            <div className="dashboard-skeleton mb-3 h-10 w-10 rounded-xl" />
            <div className="dashboard-skeleton mb-2 h-3 w-24 rounded" />
            <div className="dashboard-skeleton h-8 w-16 rounded" />
          </div>
        ))}
        <div className="lg:col-span-8 lg:row-span-2 rounded-2xl border border-border/40 p-4 sm:p-5">
          <div className="dashboard-skeleton h-[220px] rounded-xl" />
        </div>
        <div className="lg:col-span-4 rounded-2xl border border-border/40 p-4 sm:p-5">
          <div className="dashboard-skeleton mb-3 h-10 w-10 rounded-xl" />
          <div className="dashboard-skeleton mb-4 h-3 w-28 rounded" />
          <div className="dashboard-skeleton h-8 w-12 rounded" />
        </div>
        <div className="lg:col-span-7 lg:row-span-2 rounded-2xl border border-border/40 p-4 sm:p-5">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dashboard-skeleton h-12 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 rounded-2xl border border-border/40 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="dashboard-skeleton h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
