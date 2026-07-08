import type { PatientDietItem } from '@/types/patient'

export interface RegistrationMedicineRow {
  medicineIds: string[]
  medicineNames: string[]
  medicineQuantityMl?: string
  medicineQuantityUnit?: 'ml' | 'ltr'
  formType: string
  quantity?: string
  quantityOther?: string
  frequency?: string
  frequencyOther?: string
  timing?: string
  timingOther?: string
}

export interface PatientRegistrationValues {
  visitDate: string
  patientName: string
  contact: string
  address: string
  diseases: string[]
  prescription: string
  medicines: RegistrationMedicineRow[]
  dietItems: PatientDietItem[]
  additionalNotes: string
  patientFees: string
}

export type { PatientDietItem }
