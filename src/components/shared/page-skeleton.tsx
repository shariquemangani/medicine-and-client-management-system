import { bentoGridClass } from '@/utils/theme'

const block = 'animate-pulse rounded-md bg-muted'

interface PageSkeletonProps {
  label?: string
  statCards?: number
  rows?: number
}

/** Generic route-level loading state: header, stat cards, and a list/table. */
export function PageSkeleton({ label = 'Loading', statCards = 4, rows = 6 }: PageSkeletonProps) {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="space-y-2">
        <div className={`${block} h-7 w-48`} />
        <div className={`${block} h-4 w-72 max-w-full`} />
      </div>
      <div className={bentoGridClass}>
        {Array.from({ length: statCards }).map((_, i) => (
          <div key={i} className="lg:col-span-3 rounded-2xl border border-border/40 p-4 sm:p-5">
            <div className={`${block} mb-3 h-10 w-10 rounded-xl`} />
            <div className={`${block} mb-2 h-3 w-24`} />
            <div className={`${block} h-8 w-16`} />
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-2xl border border-border/40 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`${block} h-10 w-full`} />
        ))}
      </div>
    </div>
  )
}
