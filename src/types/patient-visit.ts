import type {
  PatientDietItem,
  PatientPrescribedMedicine,
} from '@/types/patient'

/** Snapshot of a single patient visit (consultation + medicines + diet + fees). */
export interface PatientVisitRecord {
  id: string
  visitDate: string
  recordedAt: string
  diseases: string[]
  diseaseLabels: string[]
  disease?: string
  prescription?: string
  prescribedMedicines: PatientPrescribedMedicine[]
  dietPlan: PatientDietItem[]
  additionalNotes?: string
  fees?: string
  summary?: string
}
