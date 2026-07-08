export interface Prescription {
  id: string
  name: string
  term: string
  academicYear: string
  classIds: string[]
  subjects: string[]
  maxScore: number
  passScore: number
  createdAt: string
}

export interface SubjectMark {
  subject: string
  score: number
  maxScore: number
}

export interface PrescriptionItem {
  id: string
  examId: string
  patientId: string
  patientName: string
  rollNumber: string
  classId: string
  marks: SubjectMark[]
  total: number
  maxTotal: number
  percentage: number
  status: 'pass' | 'fail'
}

export type PrescriptionCreateInput = Omit<Prescription, 'id' | 'createdAt'>
export type PrescriptionUpdateInput = Partial<PrescriptionCreateInput>
