'use client'

import { FileText, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PrescriptionsHeroProps {
  /** null while the data is still loading. */
  total: number | null
  subjects: number | null
  onRefresh: () => void
  onCreate: () => void
  refreshing?: boolean
}

export function PrescriptionsHero({
  total,
  subjects,
  onRefresh,
  onCreate,
  refreshing,
}: PrescriptionsHeroProps) {

  return (
    <div className="exams-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="exams-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="exams-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <FileText className="h-3 w-3" />
            {'Prescription registry'}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {'Define exams & manage results'}
          </h1>
          {total === null || subjects === null ? (
            <div className="mt-1 flex h-5 items-center" aria-busy="true">
              <div className="animate-pulse h-4 w-72 max-w-full rounded-md bg-muted" />
            </div>
          ) : (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {`${total} exams across ${subjects} subjects — create, enter marks, and review outcomes.`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="exams-hero-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {'Refresh'}
          </Button>
          <Button size="sm" className="exams-hero-primary" onClick={onCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {'Add Prescription'}
          </Button>
        </div>
      </div>
    </div>
  )
}
