const statCol = 'lg:col-span-3 rounded-2xl border border-border/40 p-4 sm:p-5'

export function SettingsStatSkeleton() {
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

export function SettingsHeroSkeleton() {
  return (
    <div className="space-y-3 p-1">
      <div className="dashboard-skeleton h-6 w-28 rounded-full" />
      <div className="dashboard-skeleton h-7 w-56 rounded" />
      <div className="dashboard-skeleton h-4 w-72 max-w-full rounded" />
    </div>
  )
}

export function SettingsContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="dashboard-skeleton h-9 w-72 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-skeleton h-10 w-full max-w-xl rounded-md" />
        ))}
        <div className="dashboard-skeleton h-9 w-28 rounded-md" />
      </div>
    </div>
  )
}
