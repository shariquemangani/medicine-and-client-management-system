'use client'

export function PatientDetailSkeleton() {
  return (
    <div className="dashboard-shell space-y-4">
      <div className="dashboard-skeleton h-36 rounded-2xl" />
      <div className="dashboard-skeleton h-12 rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="dashboard-skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
