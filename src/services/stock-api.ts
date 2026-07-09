import { cloneMockStockData } from '@/data/mock-stock'
import { requireBusinessId } from '@/lib/firebase/business-context'
import {
  generateBatchId,
  generateMovementId,
  getAvailableQuantity,
} from '@/lib/stock-utils'
import type {
  StockAdjustInput,
  StockItem,
  StockMovement,
  StockReceiveInput,
} from '@/types/stock'

const ITEMS_KEY = (businessId: string) => `stock:${businessId}:items`
const MOVEMENTS_KEY = (businessId: string) => `stock:${businessId}:movements`

function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function seedIfNeeded(businessId: string) {
  const itemsKey = ITEMS_KEY(businessId)
  const movementsKey = MOVEMENTS_KEY(businessId)

  if (!readStorage<StockItem[]>(itemsKey)) {
    const { items, movements } = cloneMockStockData()
    writeStorage(itemsKey, items)
    writeStorage(movementsKey, movements)
  }
}

function getItems(businessId: string): StockItem[] {
  seedIfNeeded(businessId)
  return readStorage<StockItem[]>(ITEMS_KEY(businessId)) ?? []
}

function getMovements(businessId: string): StockMovement[] {
  seedIfNeeded(businessId)
  return readStorage<StockMovement[]>(MOVEMENTS_KEY(businessId)) ?? []
}

function saveItems(businessId: string, items: StockItem[]) {
  writeStorage(ITEMS_KEY(businessId), items)
}

function saveMovements(businessId: string, movements: StockMovement[]) {
  writeStorage(MOVEMENTS_KEY(businessId), movements)
}

export async function fetchStockItems(): Promise<StockItem[]> {
  const businessId = requireBusinessId()
  return getItems(businessId).sort((a, b) => a.medicineName.localeCompare(b.medicineName))
}

export async function fetchStockMovements(): Promise<StockMovement[]> {
  const businessId = requireBusinessId()
  return getMovements(businessId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function fetchStockItemById(id: string): Promise<StockItem | null> {
  const items = await fetchStockItems()
  return items.find((item) => item.id === id) ?? null
}

export async function receiveStock(input: StockReceiveInput): Promise<StockItem> {
  const businessId = requireBusinessId()
  const items = getItems(businessId)
  const movements = getMovements(businessId)
  const index = items.findIndex((item) => item.id === input.stockItemId)
  if (index < 0) throw new Error('Stock item not found')

  const item = { ...items[index] }
  const now = new Date().toISOString()
  const batchId = generateBatchId()
  const batch = {
    id: batchId,
    batchNumber: input.batchNumber.trim(),
    potency: input.potency?.trim() || item.potency,
    quantity: input.quantity,
    unitCost: input.unitCost,
    expiryDate: input.expiryDate,
    supplier: input.supplier?.trim() || item.supplier,
    receivedDate: now.split('T')[0],
    location: input.location?.trim() || item.location,
  }

  item.batches = [...item.batches, batch]
  item.totalQuantity += input.quantity
  item.lastMovementAt = now
  item.updatedAt = now
  if (input.supplier?.trim()) item.supplier = input.supplier.trim()
  if (input.location?.trim()) item.location = input.location.trim()

  const movement: StockMovement = {
    id: generateMovementId(),
    stockItemId: item.id,
    medicineId: item.medicineId,
    medicineName: item.medicineName,
    type: 'purchase',
    quantity: input.quantity,
    unit: item.unit,
    batchId,
    batchNumber: batch.batchNumber,
    reference: input.reference?.trim(),
    notes: input.notes?.trim(),
    performedBy: 'Admin',
    balanceAfter: item.totalQuantity,
    createdAt: now,
  }

  items[index] = item
  saveItems(businessId, items)
  saveMovements(businessId, [movement, ...movements])
  return item
}

export async function adjustStock(input: StockAdjustInput): Promise<StockItem> {
  const businessId = requireBusinessId()
  const items = getItems(businessId)
  const movements = getMovements(businessId)
  const index = items.findIndex((item) => item.id === input.stockItemId)
  if (index < 0) throw new Error('Stock item not found')

  const item = structuredClone(items[index])
  const now = new Date().toISOString()
  const qty = Math.abs(input.quantity)

  if (qty <= 0) throw new Error('Quantity must be greater than zero')
  if (item.totalQuantity < qty) throw new Error('Insufficient stock')

  if (input.batchId) {
    const batch = item.batches.find((b) => b.id === input.batchId)
    if (!batch) throw new Error('Batch not found')
    if (batch.quantity < qty) throw new Error('Insufficient batch quantity')
    batch.quantity -= qty
    item.batches = item.batches.filter((b) => b.quantity > 0)
  } else {
    let remaining = qty
    const sorted = [...item.batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    const nextBatches = []
    for (const batch of sorted) {
      if (remaining <= 0) {
        nextBatches.push(batch)
        continue
      }
      if (batch.quantity <= remaining) {
        remaining -= batch.quantity
      } else {
        nextBatches.push({ ...batch, quantity: batch.quantity - remaining })
        remaining = 0
      }
    }
    item.batches = nextBatches
  }

  item.totalQuantity -= qty
  item.lastMovementAt = now
  item.updatedAt = now

  const movement: StockMovement = {
    id: generateMovementId(),
    stockItemId: item.id,
    medicineId: item.medicineId,
    medicineName: item.medicineName,
    type: input.type,
    quantity: -qty,
    unit: item.unit,
    batchId: input.batchId,
    batchNumber: input.batchId
      ? item.batches.find((b) => b.id === input.batchId)?.batchNumber
      : undefined,
    reference: input.reference?.trim(),
    notes: input.notes?.trim(),
    performedBy: 'Admin',
    balanceAfter: item.totalQuantity,
    createdAt: now,
  }

  items[index] = item
  saveMovements(businessId, [movement, ...movements])
  saveItems(businessId, items)
  return item
}

export async function updateStockReorder(
  stockItemId: string,
  reorderLevel: number,
  reorderQuantity: number
): Promise<StockItem> {
  const businessId = requireBusinessId()
  const items = getItems(businessId)
  const index = items.findIndex((item) => item.id === stockItemId)
  if (index < 0) throw new Error('Stock item not found')

  const item = {
    ...items[index],
    reorderLevel: Math.max(0, reorderLevel),
    reorderQuantity: Math.max(0, reorderQuantity),
    updatedAt: new Date().toISOString(),
  }
  items[index] = item
  saveItems(businessId, items)
  return item
}

export function formatStockQuantity(item: StockItem): string {
  const available = getAvailableQuantity(item)
  return `${available} / ${item.totalQuantity} ${item.unit}`
}
