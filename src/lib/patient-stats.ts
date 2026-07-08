import type { Patient } from '@/types'
import type { PatientPageStats } from '@/types/patient-page'

export const CLINIC_CURRENCY_CODE = 'INR'
export const CLINIC_CURRENCY_SYMBOL = '₹'

export function parsePatientAmount(fees?: string): number {
  const parsed = Number.parseFloat(fees?.replace(/[^0-9.-]/g, '') ?? '0')
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatPatientAmount(fees?: string): string {
  return formatAmount(parsePatientAmount(fees))
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: CLINIC_CURRENCY_CODE,
    maximumFractionDigits: 2,
  })
}

export function getPatientDiseaseLabels(patient: Patient): string[] {
  const labels = patient.diseaseLabels?.filter(Boolean) ?? []
  if (labels.length > 0) return labels

  const disease = patient.disease?.trim()
  if (!disease) return []

  return disease
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getPatientDiseaseLabel(patient: Patient): string {
  const labels = getPatientDiseaseLabels(patient)
  return labels.length > 0 ? labels.join(', ') : '—'
}

export function computePatientPageStats(patients: Patient[]): PatientPageStats {
  const totalAmount = patients.reduce((sum, patient) => sum + parsePatientAmount(patient.fees), 0)

  return {
    total: patients.length,
    totalAmount,
  }
}
