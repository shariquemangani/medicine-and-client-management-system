'use client'

import { Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SettingsHeroProps {
  loading?: boolean
  schoolName: string
  academicYear: string
  onRefresh: () => void
  refreshing?: boolean
}

export function SettingsHero({
  loading,
  schoolName,
  academicYear,
  onRefresh,
  refreshing,
}: SettingsHeroProps) {

  return (
    <div className="settings-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="settings-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="settings-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <Settings className="h-3 w-3" />
            {'Administration'}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {'Clinic Settings'}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground" aria-busy={loading || undefined}>
            {loading ? (
              <span className="inline-block h-4 w-56 max-w-full animate-pulse rounded-md bg-muted align-middle" />
            ) : (
              [`Manage ${schoolName || 'your clinic'}`, academicYear].filter(Boolean).join(' · ')
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="settings-hero-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={"mr-1.5 h-3.5 w-3.5"} />
            {'Refresh'}
          </Button>
        </div>
      </div>
    </div>
  )
}
