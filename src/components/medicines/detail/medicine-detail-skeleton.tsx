'use client'

export function MedicineDetailSkeleton() {
  return (
    <div className="medicine-vault-page dashboard-shell space-y-4" aria-busy="true">
      <div className="dashboard-skeleton h-44 rounded-2xl" />
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-skeleton h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
