'use client'

import { Activity, Plus, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared/page-hero'
import { usePermission } from '@/hooks/use-permission'
import { t } from '@/lib/labels'

interface DiseasesHeroProps {
  total?: number
  onRefresh: () => void
  onExport?: () => void
  onAdd: () => void
  refreshing?: boolean
  loading?: boolean
}

export function DiseasesHero({ total, onRefresh, onExport, onAdd, refreshing, loading }: DiseasesHeroProps) {
  const { hasPermission } = usePermission()
  const canCreate = hasPermission('medicines', 'create')
  return (
    <PageHero
      icon={Activity}
      badge={t('diseases.vaultBadge')}
      title={t('diseases.heroTitle')}
      subtitle={
        loading ? (
          <span className="inline-block h-4 w-56 max-w-full animate-pulse rounded-md bg-muted align-middle" aria-hidden />
        ) : typeof total === 'number' ? (
          t('diseases.listHeroSubtitle', { total })
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
              {t('diseases.addDisease')}
            </Button>
          )}
        </>
      }
    />
  )
}
