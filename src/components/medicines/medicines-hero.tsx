'use client'

import { BookOpen, Plus, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared/page-hero'
import { usePermission } from '@/hooks/use-permission'
import { t } from '@/lib/labels'

interface MedicinesHeroProps {
  total?: number
  active?: number
  onRefresh: () => void
  onExport?: () => void
  onAdd: () => void
  refreshing?: boolean
  loading?: boolean
}

export function MedicinesHero({ total, active, onRefresh, onExport, onAdd, refreshing, loading }: MedicinesHeroProps) {
  const { hasPermission } = usePermission()
  const canCreate = hasPermission('medicines', 'create')
  return (
    <PageHero
      icon={BookOpen}
      badge={t('medicines.vaultBadge')}
      title={t('medicines.heroTitle')}
      subtitle={
        loading ? (
          <span className="inline-block h-4 w-56 max-w-full animate-pulse rounded-md bg-muted align-middle" aria-hidden />
        ) : typeof total === 'number' ? (
          t('medicines.listHeroSubtitle', { total, active: active ?? total })
        ) : undefined
      }
      actions={
        <>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t('common.refresh')}
          </Button>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onExport} disabled={!onExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('common.export')}
          </Button>
          {canCreate && (
            <Button size="sm" className={heroPrimaryClass} onClick={onAdd}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t('medicines.addMedicine')}
            </Button>
          )}
        </>
      }
    />
  )
}
