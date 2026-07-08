'use client'

const statCol = 'lg:col-span-3 rounded-2xl border border-border/40 p-4 sm:p-5'

export function BillingStatSkeleton() {
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

export function FeesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="clinic-table-row">
          <td>
            <div className="space-y-1.5">
              <div className="dashboard-skeleton h-3 w-28 rounded" />
              <div className="dashboard-skeleton h-2.5 w-16 rounded" />
            </div>
          </td>
          <td>
            <div className="dashboard-skeleton h-5 w-20 rounded-full" />
          </td>
          <td>
            <div className="dashboard-skeleton h-3 w-16 rounded" />
          </td>
          <td>
            <div className="dashboard-skeleton h-3 w-16 rounded" />
          </td>
          <td>
            <div className="dashboard-skeleton h-3 w-16 rounded" />
          </td>
          <td className="hidden md:table-cell">
            <div className="dashboard-skeleton h-3 w-20 rounded" />
          </td>
          <td>
            <div className="dashboard-skeleton ml-auto h-8 w-14 rounded-md" />
          </td>
        </tr>
      ))}
    </>
  )
}
