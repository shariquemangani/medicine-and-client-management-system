'use client'

import Link from 'next/link'
import { Users, UserPlus, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared/page-hero'
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
    <PageHero
      icon={Users}
      badge="Patient registry"
      title="Manage patient records"
      subtitle={
        loading ? (
          <span className="inline-block h-4 w-56 max-w-full animate-pulse rounded-md bg-muted align-middle" aria-hidden />
        ) : (
          `${active} active patients across ${total} total records`
        )
      }
      actions={
        <>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onExport} disabled={!onExport || loading}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" className={heroPrimaryClass} asChild>
            <Link href={ROUTES.patientsNew}>
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Add Patient
            </Link>
          </Button>
        </>
      }
    />
  )
}
