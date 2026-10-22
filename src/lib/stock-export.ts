import { format } from 'date-fns'
import type { StockItem, StockMovement } from '@/types/stock'
import {
  getExpiredQuantity,
  getSellableQuantity,
  getStockItemValue,
  getStockLevelStatus,
  STOCK_MOVEMENT_LABELS,
  STOCK_STATUS_LABELS,
} from '@/lib/stock-utils'

/** Prefix cells that spreadsheets would evaluate as formulas (CSV injection guard). */
function safe(value: string | undefined): string {
  const text = value ?? ''
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

function formatDate(value: string | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : format(date, 'yyyy-MM-dd HH:mm')
}

export function buildLedgerCsvRows(items: StockItem[]): (string | number)[][] {
  const header = [
    'Medicine',
    'Common name',
    'Form',
    'Potency',
    'Unit',
    'Total quantity',
    'Sellable quantity',
    'Expired quantity',
    'Reorder level',
    'Reorder quantity',
    'Status',
    'Location',
    'Supplier',
    'Stock value (INR)',
    'Batches',
    'Last movement',
  ]
  const rows = items.map((item) => [
    safe(item.medicineName),
    safe(item.commonName),
    safe(item.formType),
    safe(item.potency),
    item.unit,
    item.totalQuantity,
    getSellableQuantity(item),
    getExpiredQuantity(item),
    item.reorderLevel,
    item.reorderQuantity,
    STOCK_STATUS_LABELS[getStockLevelStatus(item)],
    safe(item.location),
    safe(item.supplier),
    getStockItemValue(item),
    safe(item.batches.map((b) => `${b.batchNumber} x${b.quantity} exp ${b.expiryDate}`).join('; ')),
    formatDate(item.lastMovementAt),
  ])
  return [header, ...rows]
}

export function buildMovementsCsvRows(movements: StockMovement[]): (string | number)[][] {
  const header = [
    'Date',
    'Medicine',
    'Type',
    'Quantity',
    'Unit',
    'Balance after',
    'Batch',
    'Reference',
    'Notes',
    'Performed by',
  ]
  const rows = movements.map((m) => [
    formatDate(m.createdAt),
    safe(m.medicineName),
    STOCK_MOVEMENT_LABELS[m.type],
    m.quantity,
    m.unit,
    m.balanceAfter,
    safe(m.batchNumber),
    safe(m.reference),
    safe(m.notes),
    safe(m.performedBy),
  ])
  return [header, ...rows]
}
