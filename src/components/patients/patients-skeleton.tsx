export function PatientsStatSkeleton() {
  return (
    <>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="col-span-6 rounded-2xl border border-border/40 p-4 sm:p-5">
          <div className="dashboard-skeleton mb-3 h-10 w-10 rounded-xl" />
          <div className="dashboard-skeleton mb-2 h-3 w-24 rounded" />
          <div className="dashboard-skeleton h-8 w-14 rounded" />
        </div>
      ))}
    </>
  )
}

export function PatientsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="clinic-table-row">
          <td>
            <div className="flex items-center gap-3">
              <div className="dashboard-skeleton h-9 w-9 shrink-0 rounded-lg" />
              <div className="dashboard-skeleton h-3 w-28 rounded" />
            </div>
          </td>
          <td>
            <div className="dashboard-skeleton h-5 w-16 rounded" />
          </td>
          <td>
            <div className="dashboard-skeleton h-3 w-24 rounded" />
          </td>
          <td>
            <div className="dashboard-skeleton h-3 w-20 rounded" />
          </td>
          <td>
            <div className="space-y-1.5">
              <div className="dashboard-skeleton h-2.5 w-24 rounded" />
              <div className="dashboard-skeleton h-2.5 w-32 rounded" />
            </div>
          </td>
          <td>
            <div className="dashboard-skeleton h-3 w-32 rounded" />
          </td>
          <td>
            <div className="dashboard-skeleton h-3 w-16 rounded" />
          </td>
          <td className="clinic-table-actions-col w-16 min-w-16 max-w-16 px-1">
            <div className="ml-auto flex justify-end gap-1">
              <div className="dashboard-skeleton h-8 w-8 rounded-md" />
              <div className="dashboard-skeleton h-8 w-8 rounded-md" />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

export function PatientsCompactSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="clinic-compact-card rounded-xl border border-border/40 p-4"
          aria-hidden
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="dashboard-skeleton h-10 w-10 rounded-xl" />
              <div className="space-y-1.5">
                <div className="dashboard-skeleton h-3.5 w-28 rounded" />
                <div className="dashboard-skeleton h-2.5 w-16 rounded" />
              </div>
            </div>
            <div className="dashboard-skeleton h-5 w-14 rounded-full" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="dashboard-skeleton h-2.5 w-24 rounded" />
            <div className="dashboard-skeleton h-2.5 w-20 rounded" />
            <div className="dashboard-skeleton h-2.5 w-28 rounded" />
            <div className="dashboard-skeleton h-2.5 w-36 rounded" />
          </div>
        </div>
      ))}
    </>
  )
}
