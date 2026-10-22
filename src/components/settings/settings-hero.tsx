'use client'

import { Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero, heroButtonClass } from '@/components/shared/page-hero'

interface SettingsHeroProps {
  loading?: boolean
  schoolName: string
  academicYear: string
  onRefresh: () => void
  refreshing?: boolean
}

export function SettingsHero({ loading, schoolName, academicYear, onRefresh, refreshing }: SettingsHeroProps) {
  return (
    <PageHero
      icon={Settings}
      badge="Administration"
      title="Clinic Settings"
      subtitle={
        loading ? (
          <span className="inline-block h-4 w-56 max-w-full animate-pulse rounded-md bg-muted align-middle" aria-hidden />
        ) : (
          [`Manage ${schoolName || 'your clinic'}`, academicYear].filter(Boolean).join(' · ')
        )
      }
      actions={
        <Button variant="outline" size="sm" className={heroButtonClass} onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          {'Refresh'}
        </Button>
      }
    />
  )
}
