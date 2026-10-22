'use client'

import { Boxes, Download, PackagePlus, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared/page-hero'
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
  const loading = totalSkus === null || totalValue === null || alertCount === null
  return (
    <PageHero
      icon={Boxes}
      badge={t('inventory.badge')}
      title={t('inventory.heroTitle')}
      subtitle={
        loading ? (
          <span className="inline-block h-4 w-56 max-w-full animate-pulse rounded-md bg-muted align-middle" aria-hidden />
        ) : (
          t('inventory.heroSubtitle', {
            total: totalSkus,
            value: totalValue.toLocaleString('en-IN'),
            alerts: alertCount,
          })
        )
      }
      actions={
        <>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t('common.refresh')}
          </Button>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('common.export')}
          </Button>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onAddItem}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('inventory.addItem')}
          </Button>
          <Button size="sm" className={heroPrimaryClass} onClick={onReceive}>
            <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
            {t('inventory.receiveStock')}
          </Button>
        </>
      }
    />
  )
}
