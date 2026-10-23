const statCol = 'lg:col-span-3 rounded-2xl border border-border/40 p-4 sm:p-5'

export function BillingStatSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={statCol}>
          <div className="animate-pulse bg-muted mb-3 h-10 w-10 rounded-xl" />
          <div className="animate-pulse bg-muted mb-2 h-3 w-24 rounded-md" />
          <div className="animate-pulse bg-muted h-8 w-14 rounded-md" />
        </div>
      ))}
    </>
  )
}

export function FeesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="clinic-table-row">
          <td>
            <div className="space-y-1.5">
              <div className="animate-pulse bg-muted h-3 w-28 rounded-md" />
              <div className="animate-pulse bg-muted h-2.5 w-16 rounded-md" />
            </div>
          </td>
          <td>
            <div className="animate-pulse bg-muted h-5 w-20 rounded-full" />
          </td>
          <td>
            <div className="animate-pulse bg-muted h-3 w-16 rounded-md" />
          </td>
          <td>
            <div className="animate-pulse bg-muted h-3 w-16 rounded-md" />
          </td>
          <td>
            <div className="animate-pulse bg-muted h-3 w-16 rounded-md" />
          </td>
          <td className="hidden md:table-cell">
            <div className="animate-pulse bg-muted h-3 w-20 rounded-md" />
          </td>
          <td>
            <div className="animate-pulse bg-muted ml-auto h-8 w-14 rounded-md" />
          </td>
        </tr>
      ))}
    </>
  )
}
