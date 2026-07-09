'use client'

import { Boxes, Download, PackagePlus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/labels'

interface InventoryHeroProps {
  totalSkus: number
  totalValue: number
  alertCount: number
  onRefresh: () => void
  onReceive: () => void
  refreshing?: boolean
}

export function InventoryHero({
  totalSkus,
  totalValue,
  alertCount,
  onRefresh,
  onReceive,
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
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t('inventory.heroTitle')}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {t('inventory.heroSubtitle', {
              total: totalSkus,
              value: totalValue.toLocaleString('en-IN'),
              alerts: alertCount,
            })}
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
            {t('common.refresh')}
          </Button>
          <Button variant="outline" size="sm" className="attendance-hero-btn">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('common.export')}
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
