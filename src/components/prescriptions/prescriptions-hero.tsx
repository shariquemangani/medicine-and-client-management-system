'use client'

import { FileText, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared/page-hero'

interface PrescriptionsHeroProps {
  /** null while the data is still loading. */
  total: number | null
  subjects: number | null
  onRefresh: () => void
  onCreate: () => void
  refreshing?: boolean
}

export function PrescriptionsHero({ total, subjects, onRefresh, onCreate, refreshing }: PrescriptionsHeroProps) {
  return (
    <PageHero
      icon={FileText}
      badge="Prescription registry"
      title="Define exams & manage results"
      subtitle={
        total === null || subjects === null ? (
          <span className="inline-block h-4 w-56 max-w-full animate-pulse rounded-md bg-muted align-middle" aria-hidden />
        ) : (
          `${total} exams across ${subjects} subjects — create, enter marks, and review outcomes.`
        )
      }
      actions={
        <>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {'Refresh'}
          </Button>
          <Button size="sm" className={heroPrimaryClass} onClick={onCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {'Add Prescription'}
          </Button>
        </>
      }
    />
  )
}
