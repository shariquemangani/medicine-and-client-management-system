import type { StockItem, StockMovement, StockStats } from '@/types/stock'
import {
  buildStockAlerts,
  getStockItemValue,
  getStockLevelStatus,
  isExpired,
  isExpiringSoon,
} from './stock-utils'

export interface InventoryStats extends StockStats {
  /** Batches past their expiry date that still hold stock. */
  expiredCount: number
}

export function computeStockStats(items: StockItem[], movements: StockMovement[]): InventoryStats {
  let healthyCount = 0
  let lowCount = 0
  let criticalCount = 0
  let outOfStockCount = 0
  let totalValue = 0
  let expiringSoonCount = 0
  let expiredCount = 0

  for (const item of items) {
    totalValue += getStockItemValue(item)
    const status = getStockLevelStatus(item)
    if (status === 'healthy' || status === 'overstocked') healthyCount++
    else if (status === 'low') lowCount++
    else if (status === 'critical') criticalCount++
    else if (status === 'out_of_stock') outOfStockCount++

    for (const batch of item.batches) {
      if (isExpired(batch.expiryDate)) expiredCount++
      else if (isExpiringSoon(batch.expiryDate)) expiringSoonCount++
    }
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const movementCount30d = movements.filter(
    (m) => new Date(m.createdAt).getTime() >= thirtyDaysAgo
  ).length

  return {
    totalSkus: items.length,
    totalValue: Math.round(totalValue),
    healthyCount,
    lowCount,
    criticalCount,
    outOfStockCount,
    expiringSoonCount,
    expiredCount,
    movementCount30d,
  }
}

export function computeAlertCount(items: StockItem[]): number {
  return buildStockAlerts(items).length
}
