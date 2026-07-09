export type MedicineSortField = 'name' | 'formType' | 'status' | 'createdAt'
export type MedicineSortDirection = 'asc' | 'desc'

export interface MedicineDirectoryFilters {
  search: string
  status: string
  formType: string
}

/** @deprecated Use MedicineSortField */
export type ClassSortField = MedicineSortField
/** @deprecated Use MedicineSortDirection */
export type ClassSortDirection = MedicineSortDirection
/** @deprecated Use MedicineDirectoryFilters */
export type ClassDirectoryFilters = MedicineDirectoryFilters
