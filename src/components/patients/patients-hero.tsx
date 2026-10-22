'use client'

import Link from 'next/link'
import { Users, UserPlus, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'

interface PatientsHeroProps {
  onExport?: () => void
  total: number
  active: number
  onRefresh: () => void
  refreshing?: boolean
  loading?: boolean
}

export function PatientsHero({ total, active, onRefresh, onExport, refreshing, loading = false }: PatientsHeroProps) {
  return (
    <div className="clinic-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="clinic-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="clinic-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <Users className="h-3 w-3" />
            Patient registry
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Manage patient records
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {loading
              ? 'Search, filter, and update patient profiles.'
              : `${active} active patients across ${total} total records — search, filter, and update profiles.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="clinic-hero-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'opacity-60' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="clinic-hero-btn" onClick={onExport} disabled={!onExport || loading}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" className="clinic-hero-primary" asChild>
            <Link href={ROUTES.patientsNew}>
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Add Patient
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
