export type PatientSortField =
  | 'name'
  | 'rollNumber'
  | 'disease'
  | 'createdAt'
  | 'address'
  | 'fees'
export type PatientSortDirection = 'asc' | 'desc'

export interface PatientDirectoryFilters {
  search: string
  classId: string
  status: string
  year: string
}

export interface PatientPageStats {
  total: number
  totalAmount: number
}
