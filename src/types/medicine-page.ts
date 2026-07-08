export type ClassSortField = 'name' | 'grade' | 'section' | 'patientCount' | 'homeroomStaffName'
export type ClassSortDirection = 'asc' | 'desc'

export interface ClassDirectoryFilters {
  search: string
  grade: string
}
