import { describe, expect, it } from 'vitest'
import {
  buildStockAlerts,
  getAvailableQuantity,
  getExpiredQuantity,
  getSellableQuantity,
  getStockLevelStatus,
  getStockItemValue,
  isExpired,
  isExpiringSoon,
} from '@/lib/stock-utils'
import { computeStockStats } from '@/lib/stock-stats'
import type { StockItem } from '@/types/stock'

// Local calendar date (the app compares local dates; toISOString would be UTC and shift by a day
// for part of every day in time zones ahead of UTC).
const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const batch = (quantity: number, expiryOffsetDays: number, unitCost = 10) => ({
  id: `b${quantity}${expiryOffsetDays}`,
  batchNumber: `B${quantity}`,
  quantity,
  unitCost,
  expiryDate: day(expiryOffsetDays),
  receivedDate: day(-30),
})

function item(overrides: Partial<StockItem> = {}): StockItem {
  const base: StockItem = {
    id: 'item1',
    medicineId: 'm1',
    medicineName: 'Arnica',
    unit: 'bottles',
    totalQuantity: 0,
    reservedQuantity: 0,
    reorderLevel: 10,
    reorderQuantity: 20,
    location: 'Shelf A',
    batches: [],
    createdAt: day(-60),
    updatedAt: day(-1),
    ...overrides,
  } as StockItem
  return base
}

describe('expiry', () => {
  it('treats yesterday as expired and today as still valid', () => {
    expect(isExpired(day(-1))).toBe(true)
    expect(isExpired(day(0))).toBe(false)
    expect(isExpired(day(5))).toBe(false)
  })

  it('flags stock expiring inside the warning window only', () => {
    expect(isExpiringSoon(day(10))).toBe(true)
    expect(isExpiringSoon(day(31))).toBe(false)
    expect(isExpiringSoon(day(-2))).toBe(false)
  })
})

describe('quantities', () => {
  it('available quantity subtracts reservations and never goes negative', () => {
    expect(getAvailableQuantity(item({ totalQuantity: 10, reservedQuantity: 3 }))).toBe(7)
    expect(getAvailableQuantity(item({ totalQuantity: 2, reservedQuantity: 5 }))).toBe(0)
  })

  it('sellable stock excludes expired batches', () => {
    const stock = item({
      totalQuantity: 15,
      batches: [batch(10, 60), batch(5, -3)],
    })
    expect(getSellableQuantity(stock)).toBe(10)
    expect(getExpiredQuantity(stock)).toBe(5)
  })

  it('values only in-date batches', () => {
    const stock = item({ totalQuantity: 15, batches: [batch(10, 60, 4), batch(5, -3, 100)] })
    expect(getStockItemValue(stock)).toBe(40)
  })
})

describe('level status', () => {
  const withSellable = (qty: number, reorderLevel = 10) =>
    item({ totalQuantity: qty, reorderLevel, batches: qty > 0 ? [batch(qty, 90)] : [] })

  it('classifies stock around the reorder level', () => {
    expect(getStockLevelStatus(withSellable(0))).toBe('out_of_stock')
    expect(getStockLevelStatus(withSellable(3))).toBe('critical')
    expect(getStockLevelStatus(withSellable(10))).toBe('low')
    expect(getStockLevelStatus(withSellable(20))).toBe('healthy')
    expect(getStockLevelStatus(withSellable(40))).toBe('overstocked')
  })

  it('counts a stock item as out of stock when everything left has expired', () => {
    const stock = item({ totalQuantity: 8, batches: [batch(8, -1)] })
    expect(getStockLevelStatus(stock)).toBe('out_of_stock')
  })

  it('without a reorder rule any sellable stock is healthy', () => {
    expect(getStockLevelStatus(withSellable(1, 0))).toBe('healthy')
  })
})

describe('alerts and stats', () => {
  it('raises alerts for low, empty and expired stock and none for healthy stock', () => {
    const healthy = item({ id: 'ok', totalQuantity: 20, batches: [batch(20, 90)] })
    const low = item({ id: 'low', totalQuantity: 4, batches: [batch(4, 90)] })
    const expired = item({ id: 'exp', totalQuantity: 6, batches: [batch(6, -5)] })
    const alerts = buildStockAlerts([healthy, low, expired])
    const ids = alerts.map((a) => a.stockItemId)
    expect(ids).toContain('low')
    expect(ids).toContain('exp')
    expect(ids).not.toContain('ok')
  })

  it('computes stats without throwing for an empty ledger', () => {
    const stats = computeStockStats([], [])
    expect(stats).toBeTruthy()
  })
})
