export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online'

export interface BillingCategory {
  id: string
  name: string
  description?: string
  defaultAmount: number
}

export interface FeeStructure {
  id: string
  categoryId: string
  categoryName: string
  classId?: string
  patientId?: string
  amount: number
  dueDate: string
}

export interface Payment {
  id: string
  patientId: string
  patientName: string
  amount: number
  method: PaymentMethod
  date: string
  notes?: string
  createdAt: string
}

export interface PatientBillingSummary {
  patientId: string
  patientName: string
  rollNumber: string
  className: string
  totalDue: number
  totalPaid: number
  balance: number
  lastPaymentDate?: string
  isOverdue: boolean
}
