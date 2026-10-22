'use client'

import { Boxes, Download, PackagePlus, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/labels'

interface InventoryHeroProps {
  /** null while the stock data is still loading. */
  totalSkus: number | null
  totalValue: number | null
  alertCount: number | null
  onRefresh: () => void
  onReceive: () => void
  onAddItem: () => void
  onExport: () => void
  refreshing?: boolean
}

export function InventoryHero({
  totalSkus,
  totalValue,
  alertCount,
  onRefresh,
  onReceive,
  onAddItem,
  onExport,
  refreshing,
}: InventoryHeroProps) {
  return (
    <div className="attendance-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
      <div className="attendance-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="attendance-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <Boxes className="h-3 w-3" />
            {t('inventory.badge')}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t('inventory.heroTitle')}
          </h1>
          {totalSkus === null || totalValue === null || alertCount === null ? (
            <div className="mt-1 flex h-5 items-center" aria-busy="true">
              <div className="animate-pulse h-4 w-72 max-w-full rounded-md bg-muted" />
            </div>
          ) : (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              {t('inventory.heroSubtitle', {
                total: totalSkus,
                value: totalValue.toLocaleString('en-IN'),
                alerts: alertCount,
              })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="attendance-hero-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t('common.refresh')}
          </Button>
          <Button variant="outline" size="sm" className="attendance-hero-btn" onClick={onExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('common.export')}
          </Button>
          <Button variant="outline" size="sm" className="attendance-hero-btn" onClick={onAddItem}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('inventory.addItem')}
          </Button>
          <Button size="sm" className="attendance-hero-primary" onClick={onReceive}>
            <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
            {t('inventory.receiveStock')}
          </Button>
        </div>
      </div>
    </div>
  )
}
