'use client'

const statCol = 'lg:col-span-3 rounded-2xl border border-border/40 p-4 sm:p-5'

export function InventoryStatSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={statCol}>
          <div className="dashboard-skeleton mb-3 h-10 w-10 rounded-xl" />
          <div className="dashboard-skeleton mb-2 h-3 w-24 rounded" />
          <div className="dashboard-skeleton h-8 w-14 rounded" />
        </div>
      ))}
    </>
  )
}
