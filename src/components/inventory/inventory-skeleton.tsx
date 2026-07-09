'use client'

import { BentoCard } from '@/components/shared'

const statCol = 'lg:col-span-3'

export function InventoryStatSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <BentoCard key={i} colSpan={3} delay={i * 60}>
          <div className="dashboard-skeleton mb-3 h-10 w-10 rounded-xl" />
          <div className="dashboard-skeleton mb-2 h-3 w-24 rounded" />
          <div className="dashboard-skeleton h-8 w-14 rounded" />
        </BentoCard>
      ))}
    </>
  )
}

export function InventoryPageSkeleton() {
  return (
    <div className="inventory-page dashboard-shell space-y-4" aria-busy="true">
      <div className="dashboard-skeleton h-28 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="dashboard-skeleton h-96 rounded-2xl" />
    </div>
  )
}
