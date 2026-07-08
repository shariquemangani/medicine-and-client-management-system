import type { PatientVisitRecord } from '@/types/patient-visit'

export type PatientStatus = 'active' | 'inactive' | 'graduated'

export type MedicineVolumeUnit = 'ml' | 'ltr'

export interface PatientPrescribedMedicine {
  medicineIds: string[]
  medicineNames: string[]
  medicineQuantityMl?: string
  medicineQuantityUnit?: 'ml' | 'ltr'
  formType: string
  quantity: string
  quantityOther?: string
  frequency?: string
  frequencyOther?: string
  timing?: string
  timingOther?: string
  /** Summary string for display / legacy */
  dosage?: string
}

export interface PatientDietItem {
  item: string
  amount: string
}

export interface GuardianInfo {
  name: string
  phone: string
  email?: string
  relation: string
}

export interface PatientEmergencyContacts {
  fatherName: string
  fatherAadhar: string
  fatherMobile: string
  motherName: string
  motherAadhar: string
  motherMobile: string
  motherRelation?: string
}

export interface Patient {
  id: string
  firstName: string
  lastName: string
  firstNameUr?: string
  lastNameUr?: string
  rollNumber: string
  email: string
  phone: string
  classId: string
  className: string
  classSection?: string
  year: number
  status: PatientStatus
  dateOfBirth: string
  aadharNumber?: string
  admissionDate?: string
  madrasaName?: string
  madrasaLocation?: string
  address: string
  bedNumber?: string
  schoolName?: string
  schoolLocation?: string
  schoolTiming?: string
  fees?: string
  guardian: GuardianInfo
  parents?: PatientEmergencyContacts
  notes?: string
  /** Disease IDs from consultation multiselect */
  diseases?: string[]
  /** Resolved disease labels for display */
  diseaseLabels?: string[]
  /** Comma-separated disease summary */
  disease?: string
  prescription?: string
  prescribedMedicines?: PatientPrescribedMedicine[]
  dietPlan?: PatientDietItem[]
  additionalNotes?: string
  visitHistory?: PatientVisitRecord[]
  createdAt: string
  updatedAt: string
}

export type PatientCreateInput = Omit<Patient, 'id' | 'className' | 'createdAt' | 'updatedAt'>
export type PatientUpdateInput = Partial<PatientCreateInput>
