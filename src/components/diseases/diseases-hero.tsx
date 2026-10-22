'use client'

import { Activity, Plus, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/use-permission'
import { t } from '@/lib/labels'
import { Skel } from '@/components/medicines/skeleton-bits'

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
    <div className="diseases-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="diseases-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="diseases-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <Activity className="h-3 w-3" />
            {t('diseases.vaultBadge')}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t('diseases.heroTitle')}
          </h1>
          {loading ? (
            <div className="mt-1.5" aria-busy="true">
              <Skel className="h-4 w-40" />
            </div>
          ) : typeof total === 'number' ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {t('diseases.listHeroSubtitle', { total })}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="diseases-hero-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t('common.refresh')}
          </Button>
          <Button variant="outline" size="sm" className="diseases-hero-btn" onClick={onExport} disabled={!onExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('common.export')}
          </Button>
          {canCreate && (
            <Button size="sm" className="diseases-hero-primary" onClick={onAdd}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t('diseases.addDisease')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
