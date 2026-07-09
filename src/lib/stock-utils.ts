import type { StockAlert, StockItem, StockLevelStatus } from '@/types/stock'

const EXPIRY_WARNING_DAYS = 30

export function getAvailableQuantity(item: StockItem): number {
  return Math.max(0, item.totalQuantity - item.reservedQuantity)
}

export function getStockLevelStatus(item: StockItem): StockLevelStatus {
  const available = getAvailableQuantity(item)
  if (available <= 0) return 'out_of_stock'
  if (available <= Math.floor(item.reorderLevel * 0.5)) return 'critical'
  if (available <= item.reorderLevel) return 'low'
  if (available >= item.reorderLevel * 4) return 'overstocked'
  return 'healthy'
}

export function getStockFillPercent(item: StockItem): number {
  if (item.reorderLevel <= 0) return item.totalQuantity > 0 ? 100 : 0
  const target = item.reorderLevel * 2
  return Math.min(100, Math.round((getAvailableQuantity(item) / target) * 100))
}

export function getBatchValue(batch: { quantity: number; unitCost: number }): number {
  return batch.quantity * batch.unitCost
}

export function getStockItemValue(item: StockItem): number {
  return item.batches.reduce((sum, batch) => sum + getBatchValue(batch), 0)
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

export function buildStockAlerts(items: StockItem[]): StockAlert[] {
  const alerts: StockAlert[] = []

  for (const item of items) {
    const status = getStockLevelStatus(item)
    const available = getAvailableQuantity(item)

    if (status === 'out_of_stock') {
      alerts.push({
        id: `alert-oos-${item.id}`,
        stockItemId: item.id,
        medicineName: item.medicineName,
        formType: item.formType,
        potency: item.potency,
        alertType: 'out_of_stock',
        message: `${item.medicineName} is out of stock`,
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
        message: `${item.medicineName} is critically low (${available} ${item.unit} left)`,
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
        message: `${item.medicineName} is below reorder level`,
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
          message: `Batch ${batch.batchNumber} has expired`,
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
          message: `Batch ${batch.batchNumber} expires in ${days} days`,
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
