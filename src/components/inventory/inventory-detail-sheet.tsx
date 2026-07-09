'use client'

import { format } from 'date-fns'
import { Boxes, MapPin, Package } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { StockItem, StockMovement } from '@/types/stock'
import {
  daysUntilExpiry,
  getAvailableQuantity,
  getStockItemValue,
  getStockLevelStatus,
  isExpiringSoon,
  STOCK_STATUS_LABELS,
} from '@/lib/stock-utils'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

interface InventoryDetailSheetProps {
  item: StockItem | null
  movements: StockMovement[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onReceive: (item: StockItem) => void
  onAdjust: (item: StockItem) => void
}

export function InventoryDetailSheet({
  item,
  movements,
  open,
  onOpenChange,
  onReceive,
  onAdjust,
}: InventoryDetailSheetProps) {
  if (!item) return null

  const status = getStockLevelStatus(item)
  const itemMovements = movements.filter((m) => m.stockItemId === item.id).slice(0, 5)
  const totalValue = getStockItemValue(item)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">{item.medicineName}</SheetTitle>
          <SheetDescription>
            {[item.formType, item.potency, item.commonName].filter(Boolean).join(' · ')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="attendance-record-toolbar rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t('inventory.colOnHand')}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {getAvailableQuantity(item)}{' '}
                  <span className="text-sm font-medium text-muted-foreground">/ {item.totalQuantity} {item.unit}</span>
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {STOCK_STATUS_LABELS[status]}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-muted-foreground">{t('inventory.statValue')}</p>
                <p className="mt-1 font-bold tabular-nums">₹{totalValue.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="text-muted-foreground">{t('inventory.reorderAt')}</p>
                <p className="mt-1 font-bold tabular-nums">{item.reorderLevel} {item.unit}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="attendance-hero-primary flex-1" onClick={() => onReceive(item)}>
                <Package className="mr-1.5 h-3.5 w-3.5" />
                {t('inventory.receiveStock')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="attendance-hero-btn flex-1"
                onClick={() => onAdjust(item)}
                disabled={item.totalQuantity <= 0}
              >
                {t('inventory.adjustStock')}
              </Button>
            </div>
          </div>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-[hsl(var(--metric-attendance))]" />
              {t('inventory.detailLocation')}
            </h3>
            <p className="text-sm text-muted-foreground">{item.location}</p>
            {item.supplier ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('inventory.supplier')}: {item.supplier}
              </p>
            ) : null}
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Boxes className="h-4 w-4 text-[hsl(var(--metric-attendance))]" />
              {t('inventory.detailBatches')} ({item.batches.length})
            </h3>
            {item.batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('inventory.noBatches')}</p>
            ) : (
              <div className="space-y-2">
                {item.batches.map((batch) => {
                  const days = daysUntilExpiry(batch.expiryDate)
                  const expiring = isExpiringSoon(batch.expiryDate)
                  return (
                    <div
                      key={batch.id}
                      className={cn(
                        'rounded-xl border p-3 text-sm',
                        days < 0 && 'border-red-500/30 bg-red-500/[0.04]',
                        expiring && days >= 0 && 'border-amber-500/30 bg-amber-500/[0.04]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{batch.batchNumber}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {batch.quantity} {item.unit} · ₹{batch.unitCost}/unit
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {days < 0
                            ? t('inventory.expired')
                            : t('inventory.expiresIn', { days })}
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {t('inventory.expiry')}: {batch.expiryDate}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {itemMovements.length > 0 ? (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {t('inventory.recentMovements')}
              </h3>
              <div className="space-y-2">
                {itemMovements.map((m) => (
                  <div key={m.id} className="rounded-xl border bg-muted/10 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{m.type}</span>
                      <span className={cn('font-bold tabular-nums', m.quantity > 0 && 'text-emerald-600')}>
                        {m.quantity > 0 ? '+' : ''}
                        {m.quantity} {m.unit}
                      </span>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">
                      {format(new Date(m.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
