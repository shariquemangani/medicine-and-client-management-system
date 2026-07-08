'use client'

import { ClipboardCheck, RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InventoryHeroProps {
  present: number
  total: number
  onRefresh: () => void
  onSave: () => void
  refreshing?: boolean
  saving?: boolean
}

export function InventoryHero({
  present,
  total,
  onRefresh,
  onSave,
  refreshing,
  saving,
}: InventoryHeroProps) {

  return (
    <div className="attendance-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="attendance-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="attendance-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <ClipboardCheck className="h-3 w-3" />
            {'Daily records'}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {'Record & review attendance'}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {`${present} present of ${total} patients marked for today`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="attendance-hero-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {'Refresh'}
          </Button>
          <Button
            size="sm"
            className="attendance-hero-primary"
            onClick={onSave}
            disabled={saving || total === 0}
          >
            <Save className={`mr-1.5 h-3.5 w-3.5 ${saving ? 'animate-pulse' : ''}`} />
            {'Save attendance'}
          </Button>
        </div>
      </div>
    </div>
  )
}
