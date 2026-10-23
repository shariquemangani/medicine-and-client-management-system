import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  type Transaction,
} from 'firebase/firestore/lite'
import { auth, db } from '@/lib/firebase/app'
import { readStoredAuthSession } from '@/lib/auth-session'
import { requireBusinessId } from '@/lib/firebase/business-context'
import {
  generateBatchId,
  generateMovementId,
  getAvailableQuantity,
  getSellableQuantity,
  isExpired,
} from '@/lib/stock-utils'
import type {
  StockAdjustInput,
  StockItem,
  StockItemInput,
  StockItemUpdate,
  StockMovement,
  StockReceiveInput,
} from '@/types/stock'

/** Latest movements loaded into the ledger; older ones stay in Firestore. */
const MOVEMENT_LIMIT = 300

const itemsCollection = (businessId: string) =>
  collection(db, 'businesses', businessId, 'stockItems')
const movementsCollection = (businessId: string) =>
  collection(db, 'businesses', businessId, 'stockMovements')

/** Firestore rejects `undefined` field values; drop them (deeply) before writing. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function actor(): { name: string; id: string } {
  // Firestore rules require performedById to equal the signed-in uid, so never fall back to a cached id.
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Your session has expired. Please sign in again')
  const user = readStoredAuthSession()?.user
  return { name: user?.name?.trim() || user?.email || 'Unknown user', id: uid }
}

function slug(value: string | undefined): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** One stock item per medicine + potency, so the id is deterministic and duplicates are impossible. */
export function buildStockItemId(medicineId: string, potency?: string): string {
  return `${slug(medicineId)}__${slug(potency) || 'na'}`
}

function assertPositive(quantity: number, label = 'Quantity') {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`${label} must be greater than zero`)
  }
}

async function readItem(
  transaction: Transaction,
  businessId: string,
  stockItemId: string
): Promise<StockItem> {
  const snap = await transaction.get(doc(itemsCollection(businessId), stockItemId))
  if (!snap.exists()) throw new Error('Stock item not found')
  return { ...(snap.data() as Omit<StockItem, 'id'>), id: snap.id, batches: (snap.data().batches ?? []) as StockItem['batches'] }
}

function buildMovement(
  item: StockItem,
  partial: Pick<StockMovement, 'type' | 'quantity'> &
    Partial<Pick<StockMovement, 'batchId' | 'batchNumber' | 'reference' | 'notes'>>,
  now: string
): StockMovement {
  const who = actor()
  return clean({
    id: generateMovementId(),
    stockItemId: item.id,
    medicineId: item.medicineId,
    medicineName: item.medicineName,
    unit: item.unit,
    balanceAfter: item.totalQuantity,
    performedBy: who.name,
    performedById: who.id,
    createdAt: now,
    ...partial,
    reference: partial.reference?.trim() || undefined,
    notes: partial.notes?.trim() || undefined,
  })
}

export async function fetchStockItems(): Promise<StockItem[]> {
  const businessId = requireBusinessId()
  const snap = await getDocs(itemsCollection(businessId))
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<StockItem, 'id'>), id: d.id, batches: (d.data().batches ?? []) as StockItem['batches'] }))
    .sort((a, b) => a.medicineName.localeCompare(b.medicineName))
}

export async function fetchStockMovements(): Promise<StockMovement[]> {
  const businessId = requireBusinessId()
  const snap = await getDocs(
    query(movementsCollection(businessId), orderBy('createdAt', 'desc'), limit(MOVEMENT_LIMIT))
  )
  return snap.docs.map((d) => ({ ...(d.data() as Omit<StockMovement, 'id'>), id: d.id }))
}

export async function fetchStockItemById(id: string): Promise<StockItem | null> {
  const businessId = requireBusinessId()
  const snap = await getDoc(doc(itemsCollection(businessId), id))
  if (!snap.exists()) return null
  return { ...(snap.data() as Omit<StockItem, 'id'>), id: snap.id, batches: (snap.data().batches ?? []) as StockItem['batches'] }
}

export async function createStockItem(input: StockItemInput): Promise<StockItem> {
  const businessId = requireBusinessId()
  if (!input.medicineId?.trim() || !input.medicineName?.trim()) {
    throw new Error('Select a medicine from the vault')
  }
  if (!input.location?.trim()) throw new Error('Storage location is required')
  if (!Number.isFinite(input.reorderLevel) || input.reorderLevel < 0) {
    throw new Error('Reorder level cannot be negative')
  }
  if (!Number.isFinite(input.reorderQuantity) || input.reorderQuantity < 0) {
    throw new Error('Reorder quantity cannot be negative')
  }

  const id = buildStockItemId(input.medicineId, input.potency)
  const ref = doc(itemsCollection(businessId), id)
  const now = new Date().toISOString()

  return runTransaction(db, async (transaction) => {
    if ((await transaction.get(ref)).exists()) {
      throw new Error('This medicine and potency is already tracked in stock')
    }
    const item: StockItem = clean({
      id,
      medicineId: input.medicineId,
      medicineName: input.medicineName.trim(),
      commonName: input.commonName?.trim() || undefined,
      formType: input.formType || undefined,
      potency: input.potency?.trim() || undefined,
      unit: input.unit,
      totalQuantity: 0,
      reservedQuantity: 0,
      reorderLevel: Math.floor(input.reorderLevel),
      reorderQuantity: Math.floor(input.reorderQuantity),
      location: input.location.trim(),
      supplier: input.supplier?.trim() || undefined,
      batches: [],
      createdAt: now,
      updatedAt: now,
    })
    transaction.set(ref, item)
    return item
  })
}

export async function updateStockItem(stockItemId: string, patch: StockItemUpdate): Promise<StockItem> {
  const businessId = requireBusinessId()
  const ref = doc(itemsCollection(businessId), stockItemId)

  return runTransaction(db, async (transaction) => {
    const current = await readItem(transaction, businessId, stockItemId)
    const next: StockItem = clean({
      ...current,
      ...(patch.unit ? { unit: patch.unit } : {}),
      ...(patch.location !== undefined ? { location: patch.location.trim() || current.location } : {}),
      ...(patch.supplier !== undefined ? { supplier: patch.supplier.trim() || undefined } : {}),
      ...(patch.commonName !== undefined ? { commonName: patch.commonName.trim() || undefined } : {}),
      ...(patch.formType !== undefined ? { formType: patch.formType || undefined } : {}),
      ...(patch.reorderLevel !== undefined ? { reorderLevel: Math.max(0, Math.floor(patch.reorderLevel)) } : {}),
      ...(patch.reorderQuantity !== undefined
        ? { reorderQuantity: Math.max(0, Math.floor(patch.reorderQuantity)) }
        : {}),
      updatedAt: new Date().toISOString(),
    })
    transaction.set(ref, next)
    return next
  })
}

/** Convenience wrapper kept for the reorder-level editor. */
export async function updateStockReorder(
  stockItemId: string,
  reorderLevel: number,
  reorderQuantity: number
): Promise<StockItem> {
  return updateStockItem(stockItemId, { reorderLevel, reorderQuantity })
}

/** Only empty items can be removed; movement history is always kept. */
export async function deleteStockItem(stockItemId: string): Promise<void> {
  const businessId = requireBusinessId()
  const ref = doc(itemsCollection(businessId), stockItemId)
  await runTransaction(db, async (transaction) => {
    const item = await readItem(transaction, businessId, stockItemId)
    if (item.totalQuantity > 0) {
      throw new Error('Only items with no stock left can be deleted. Adjust the stock to zero first')
    }
    transaction.delete(ref)
  })
}

export async function receiveStock(input: StockReceiveInput): Promise<StockItem> {
  await auth.authStateReady()
  const businessId = requireBusinessId()

  assertPositive(input.quantity)
  if (!input.batchNumber.trim()) throw new Error('Batch number is required')
  if (!Number.isFinite(input.unitCost) || input.unitCost < 0) {
    throw new Error('Unit cost cannot be negative')
  }
  const expiry = new Date(`${input.expiryDate}T23:59:59`)
  if (!input.expiryDate || Number.isNaN(expiry.getTime())) {
    throw new Error('A valid expiry date is required')
  }
  if (expiry.getTime() < Date.now()) {
    throw new Error('Expiry date is in the past. Expired stock cannot be received')
  }

  const ref = doc(itemsCollection(businessId), input.stockItemId)
  const movementId = generateMovementId()

  return runTransaction(db, async (transaction) => {
    const current = await readItem(transaction, businessId, input.stockItemId)
    const now = new Date().toISOString()
    const batchNumber = input.batchNumber.trim()

    // Receiving the same batch number again tops up that batch instead of duplicating it.
    const existing = current.batches.find(
      (b) => b.batchNumber.toLowerCase() === batchNumber.toLowerCase() && b.expiryDate === input.expiryDate
    )
    const batchId = existing?.id ?? generateBatchId()
    const batches = existing
      ? current.batches.map((b) =>
          b.id === existing.id
            ? {
                ...b,
                quantity: b.quantity + input.quantity,
                // Weighted average, so a top-up at a new price is not silently ignored.
                unitCost: Math.round(((b.quantity * b.unitCost + input.quantity * input.unitCost) / (b.quantity + input.quantity)) * 100) / 100,
              }
            : b
        )
      : [
          ...current.batches,
          {
            id: batchId,
            batchNumber,
            potency: input.potency?.trim() || current.potency,
            quantity: input.quantity,
            unitCost: input.unitCost,
            expiryDate: input.expiryDate,
            supplier: input.supplier?.trim() || current.supplier,
            receivedDate: now.split('T')[0],
            location: input.location?.trim() || current.location,
          },
        ]

    const item: StockItem = clean({
      ...current,
      batches,
      totalQuantity: current.totalQuantity + input.quantity,
      supplier: input.supplier?.trim() || current.supplier,
      location: input.location?.trim() || current.location,
      lastMovementAt: now,
      updatedAt: now,
    })

    const movement = buildMovement(
      item,
      {
        type: 'purchase',
        quantity: input.quantity,
        batchId,
        batchNumber,
        reference: input.reference,
        notes: input.notes,
      },
      now
    )
    movement.id = movementId

    transaction.set(ref, item)
    transaction.set(doc(movementsCollection(businessId), movementId), movement)
    return item
  })
}

export async function adjustStock(input: StockAdjustInput): Promise<StockItem> {
  await auth.authStateReady()
  const businessId = requireBusinessId()
  assertPositive(input.quantity)

  const adds = input.type === 'return' || (input.type === 'adjustment' && input.direction === 'in')
  if (adds && !input.batchId) throw new Error('Choose the batch the stock is added back to')

  const ref = doc(itemsCollection(businessId), input.stockItemId)
  const movementId = generateMovementId()

  return runTransaction(db, async (transaction) => {
    const current = await readItem(transaction, businessId, input.stockItemId)
    const now = new Date().toISOString()
    const qty = Math.floor(input.quantity)
    let batches = current.batches.map((b) => ({ ...b }))
    let signedQty: number

    if (adds) {
      const batch = batches.find((b) => b.id === input.batchId)
      if (!batch) throw new Error('Batch not found')
      batch.quantity += qty
      signedQty = qty
    } else {
      // Dispensing only uses in-date stock; writing off expired stock only uses expired batches;
      // count corrections may touch any batch.
      const eligible = batches.filter((b) =>
        input.type === 'dispense' ? !isExpired(b.expiryDate) : input.type === 'expired' ? isExpired(b.expiryDate) : true
      )
      const pool =
        input.type === 'dispense'
          ? getSellableQuantity(current)
          : eligible.reduce((sum, b) => sum + b.quantity, 0)
      if (pool < qty) {
        const what = input.type === 'expired' ? 'expired' : 'available'
        throw new Error(`Insufficient stock: only ${pool} ${current.unit} ${what}`)
      }
      if (input.batchId) {
        const batch = batches.find((b) => b.id === input.batchId)
        if (!batch) throw new Error('Batch not found')
        if (!eligible.includes(batch)) {
          throw new Error(
            input.type === 'dispense'
              ? 'That batch has expired and cannot be dispensed'
              : 'That batch has not expired yet'
          )
        }
        if (batch.quantity < qty) {
          throw new Error(`Insufficient batch quantity: only ${batch.quantity} ${current.unit} in this batch`)
        }
        batch.quantity -= qty
      } else {
        // FEFO: take from the eligible batches that expire first.
        let remaining = qty
        for (const batch of [...eligible].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))) {
          if (remaining <= 0) break
          const take = Math.min(batch.quantity, remaining)
          batch.quantity -= take
          remaining -= take
        }
        if (remaining > 0) throw new Error('Insufficient stock in batches')
      }
      signedQty = -qty
    }

    batches = batches.filter((b) => b.quantity > 0)
    const item: StockItem = clean({
      ...current,
      batches,
      totalQuantity: current.totalQuantity + signedQty,
      lastMovementAt: now,
      updatedAt: now,
    })

    const batchRef = input.batchId ? current.batches.find((b) => b.id === input.batchId) : undefined
    const movement = buildMovement(
      item,
      {
        type: input.type,
        quantity: signedQty,
        batchId: input.batchId,
        batchNumber: batchRef?.batchNumber,
        reference: input.reference,
        notes: input.notes,
      },
      now
    )
    movement.id = movementId

    transaction.set(ref, item)
    transaction.set(doc(movementsCollection(businessId), movementId), movement)
    return item
  })
}

export function formatStockQuantity(item: StockItem): string {
  const available = getAvailableQuantity(item)
  return `${available} / ${item.totalQuantity} ${item.unit}`
}
