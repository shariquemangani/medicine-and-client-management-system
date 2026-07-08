export type PrescriptionSortField = 'name' | 'term' | 'academicYear' | 'subjects'
export type PrescriptionSortDirection = 'asc' | 'desc'

export interface PrescriptionDirectoryFilters {
  search: string
  term: string
}
