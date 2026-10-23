export function DiseasesTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="clinic-table-row">
          <td>
            <div className="flex items-center gap-3">
              <div className="dashboard-skeleton h-9 w-9 shrink-0 rounded-lg" />
              <div className="dashboard-skeleton h-3 w-36 rounded" />
            </div>
          </td>
          <td>
            <div className="dashboard-skeleton h-3 w-40 rounded" />
          </td>
          <td>
            <div className="dashboard-skeleton h-3 w-36 rounded" />
          </td>
          <td>
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

export function DiseasesCompactSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="clinic-compact-card rounded-xl border border-border/40 p-4"
          aria-hidden
        >
          <div className="flex items-center gap-3">
            <div className="dashboard-skeleton h-10 w-10 rounded-xl" />
            <div className="space-y-1.5">
              <div className="dashboard-skeleton h-3.5 w-28 rounded" />
              <div className="dashboard-skeleton h-2.5 w-24 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
