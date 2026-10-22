import type { StockAlert, StockItem, StockLevelStatus } from '@/types/stock'
import { t } from '@/lib/labels'

const EXPIRY_WARNING_DAYS = 30

/** Total on hand minus reservations. Includes expired batches; use getSellableQuantity for stock that can be dispensed. */
export function getAvailableQuantity(item: StockItem): number {
  return Math.max(0, item.totalQuantity - item.reservedQuantity)
}

/** Quantity in batches that have expired (still physically on the shelf, but not sellable). */
export function getExpiredQuantity(item: StockItem): number {
  return item.batches.reduce((sum, b) => (isExpired(b.expiryDate) ? sum + b.quantity : sum), 0)
}

/** Stock that can actually be dispensed: expired batches are excluded. */
export function getSellableQuantity(item: StockItem): number {
  const live = item.batches.reduce((sum, b) => (isExpired(b.expiryDate) ? sum : sum + b.quantity), 0)
  return Math.max(0, live - item.reservedQuantity)
}

export function getStockLevelStatus(item: StockItem): StockLevelStatus {
  const sellable = getSellableQuantity(item)
  const level = Math.max(0, item.reorderLevel)
  if (sellable <= 0) return 'out_of_stock'
  // No reorder rule configured: any sellable stock is healthy.
  if (level === 0) return 'healthy'
  if (sellable <= Math.max(1, Math.floor(level * 0.5)) && sellable < level) return 'critical'
  if (sellable <= level) return 'low'
  if (sellable >= level * 4) return 'overstocked'
  return 'healthy'
}

export function getStockFillPercent(item: StockItem): number {
  const sellable = getSellableQuantity(item)
  if (item.reorderLevel <= 0) return sellable > 0 ? 100 : 0
  const target = item.reorderLevel * 2
  return Math.min(100, Math.round((sellable / target) * 100))
}

export function getBatchValue(batch: { quantity: number; unitCost: number }): number {
  return batch.quantity * batch.unitCost
}

/** Value of sellable stock; expired batches are excluded. */
export function getStockItemValue(item: StockItem): number {
  return item.batches.reduce(
    (sum, batch) => (isExpired(batch.expiryDate) ? sum : sum + getBatchValue(batch)),
    0
  )
}

export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate.includes('T') ? expiryDate : `${expiryDate}T12:00:00`)
  expiry.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function isExpiringSoon(expiryDate: string, withinDays = EXPIRY_WARNING_DAYS): boolean {
  const days = daysUntilExpiry(expiryDate)
  return days >= 0 && days <= withinDays
}

export function isExpired(expiryDate: string): boolean {
  return daysUntilExpiry(expiryDate) < 0
}

/** "Arnica Montana 30C": potency tells apart items of the same medicine. */
function itemLabel(item: StockItem): string {
  return item.potency ? `${item.medicineName} ${item.potency}` : item.medicineName
}

export function buildStockAlerts(items: StockItem[]): StockAlert[] {
  const alerts: StockAlert[] = []

  for (const item of items) {
    const status = getStockLevelStatus(item)
    const available = getSellableQuantity(item)

    if (status === 'out_of_stock') {
      alerts.push({
        id: `alert-oos-${item.id}`,
        stockItemId: item.id,
        medicineName: item.medicineName,
        formType: item.formType,
        potency: item.potency,
        alertType: 'out_of_stock',
        message: t('inventory.alertOutOfStock', { name: itemLabel(item) }),
        quantity: available,
        reorderLevel: item.reorderLevel,
        severity: 'critical',
      })
    } else if (status === 'critical') {
      alerts.push({
        id: `alert-crit-${item.id}`,
        stockItemId: item.id,
        medicineName: item.medicineName,
        formType: item.formType,
        potency: item.potency,
        alertType: 'critical_stock',
        message: t('inventory.alertCritical', { name: itemLabel(item), qty: available, unit: item.unit }),
        quantity: available,
        reorderLevel: item.reorderLevel,
        severity: 'critical',
      })
    } else if (status === 'low') {
      alerts.push({
        id: `alert-low-${item.id}`,
        stockItemId: item.id,
        medicineName: item.medicineName,
        formType: item.formType,
        potency: item.potency,
        alertType: 'low_stock',
        message: t('inventory.alertLow', { name: itemLabel(item), qty: available, unit: item.unit }),
        quantity: available,
        reorderLevel: item.reorderLevel,
        severity: 'warning',
      })
    }

    for (const batch of item.batches) {
      if (isExpired(batch.expiryDate)) {
        alerts.push({
          id: `alert-exp-${batch.id}`,
          stockItemId: item.id,
          medicineName: item.medicineName,
          formType: item.formType,
          potency: batch.potency ?? item.potency,
          alertType: 'expired',
          message: `${itemLabel(item)}: ` + t('inventory.alertBatchExpired', { batch: batch.batchNumber, date: batch.expiryDate, qty: batch.quantity, unit: item.unit }),
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          batchNumber: batch.batchNumber,
          severity: 'critical',
        })
      } else if (isExpiringSoon(batch.expiryDate)) {
        const days = daysUntilExpiry(batch.expiryDate)
        alerts.push({
          id: `alert-exp-soon-${batch.id}`,
          stockItemId: item.id,
          medicineName: item.medicineName,
          formType: item.formType,
          potency: batch.potency ?? item.potency,
          alertType: 'expiring_soon',
          message: `${itemLabel(item)}: ` + t('inventory.alertBatchExpiring', { batch: batch.batchNumber, days }),
          quantity: batch.quantity,
          expiryDate: batch.expiryDate,
          batchNumber: batch.batchNumber,
          severity: days <= 14 ? 'warning' : 'info',
        })
      }
    }
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

export function generateStockId(): string {
  return `stk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateBatchId(): string {
  return `bat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function generateMovementId(): string {
  return `mov-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export const STOCK_STATUS_LABELS: Record<StockLevelStatus, string> = {
  healthy: 'Healthy',
  low: 'Low stock',
  critical: 'Critical',
  out_of_stock: 'Out of stock',
  overstocked: 'Overstocked',
}

export const STOCK_MOVEMENT_LABELS = {
  purchase: 'Purchase',
  dispense: 'Dispense',
  adjustment: 'Adjustment',
  return: 'Return',
  expired: 'Expired',
  transfer: 'Transfer',
} as const

export const STOCK_UNIT_OPTIONS = [
  { value: 'bottles', label: 'Bottles' },
  { value: 'strips', label: 'Strips' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'grams', label: 'Grams' },
  { value: 'units', label: 'Units' },
] as const

/** Batches sorted by earliest expiry first. */
export function sortBatchesByExpiry<T extends { expiryDate: string }>(batches: T[]): T[] {
  return [...batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
}

/** Local date as YYYY-MM-DD, for `<input type="date" min>` and comparisons. */
export function todayIsoDate(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}
