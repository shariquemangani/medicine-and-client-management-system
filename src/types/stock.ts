export type StockUnit = 'bottles' | 'strips' | 'ml' | 'grams' | 'units'

export type StockLevelStatus = 'healthy' | 'low' | 'critical' | 'out_of_stock' | 'overstocked'

export type StockMovementType =
  | 'purchase'
  | 'dispense'
  | 'adjustment'
  | 'return'
  | 'expired'
  | 'transfer'

export interface StockBatch {
  id: string
  batchNumber: string
  potency?: string
  quantity: number
  unitCost: number
  expiryDate: string
  supplier?: string
  receivedDate: string
  location?: string
}

export interface StockItem {
  id: string
  medicineId: string
  medicineName: string
  commonName?: string
  formType?: string
  potency?: string
  unit: StockUnit
  totalQuantity: number
  reservedQuantity: number
  reorderLevel: number
  reorderQuantity: number
  location: string
  supplier?: string
  batches: StockBatch[]
  lastMovementAt?: string
  /** Ledger entry written together with the latest change of totalQuantity (enforced by firestore.rules). */
  lastMovementId?: string
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  stockItemId: string
  medicineId: string
  medicineName: string
  type: StockMovementType
  quantity: number
  unit: StockUnit
  batchId?: string
  batchNumber?: string
  reference?: string
  notes?: string
  performedBy?: string
  /** Firebase uid of the user who made the movement (audit trail). */
  performedById?: string
  balanceAfter: number
  createdAt: string
}

export interface StockStats {
  totalSkus: number
  totalValue: number
  healthyCount: number
  lowCount: number
  criticalCount: number
  outOfStockCount: number
  expiringSoonCount: number
  movementCount30d: number
}

export interface StockReceiveInput {
  stockItemId: string
  quantity: number
  batchNumber: string
  potency?: string
  unitCost: number
  expiryDate: string
  supplier?: string
  location?: string
  reference?: string
  notes?: string
}

export type StockAdjustType = 'dispense' | 'adjustment' | 'return' | 'expired'

export interface StockAdjustInput {
  stockItemId: string
  type: StockAdjustType
  /** Always a positive number; the direction is derived from `type` and `direction`. */
  quantity: number
  /**
   * Only for `adjustment` (count corrections): `in` adds to a batch, `out` removes.
   * `dispense` and `expired` always remove stock, `return` always adds it back.
   */
  direction?: 'in' | 'out'
  /** Required whenever stock is added (`return`, or `adjustment` with direction `in`). */
  batchId?: string
  reference?: string
  notes?: string
}

export interface StockAlert {
  id: string
  stockItemId: string
  medicineName: string
  formType?: string
  potency?: string
  alertType: 'low_stock' | 'critical_stock' | 'out_of_stock' | 'expiring_soon' | 'expired'
  message: string
  quantity?: number
  reorderLevel?: number
  expiryDate?: string
  batchNumber?: string
  severity: 'info' | 'warning' | 'critical'
}

/** Fields a user can set when creating or editing a stock item (SKU). */
export interface StockItemInput {
  medicineId: string
  medicineName: string
  commonName?: string
  formType?: string
  potency?: string
  unit: StockUnit
  reorderLevel: number
  reorderQuantity: number
  location: string
  supplier?: string
}

export type StockItemUpdate = Partial<
  Pick<
    StockItemInput,
    'unit' | 'reorderLevel' | 'reorderQuantity' | 'location' | 'supplier' | 'commonName' | 'formType'
  >
>
