import type { StockLevelStatus } from './stock'

export type StockSortField =
  | 'medicineName'
  | 'totalQuantity'
  | 'reorderLevel'
  | 'location'
  | 'lastMovementAt'

export type StockSortDirection = 'asc' | 'desc'

export type StockDirectoryTab = 'ledger' | 'movements' | 'alerts'

export interface StockDirectoryFilters {
  search: string
  status: StockLevelStatus | 'all'
  formType: string
  location: string
}
