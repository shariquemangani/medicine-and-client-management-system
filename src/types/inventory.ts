export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface InventoryRecord {
  id: string
  date: string
  classId: string
  className: string
  patientId: string
  patientName: string
  rollNumber: string
  status: AttendanceStatus
  recordedAt: string
}

export interface InventoryBulkInput {
  date: string
  classId: string
  records: { patientId: string; status: AttendanceStatus }[]
}

export interface InventorySummary {
  patientId: string
  patientName: string
  rollNumber: string
  present: number
  absent: number
  late: number
  total: number
}
