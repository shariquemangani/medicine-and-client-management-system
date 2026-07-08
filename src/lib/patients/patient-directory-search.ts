import { format } from 'date-fns'
import type { Patient } from '@/types'
import { getPatientDisplayName } from '@/lib/patient-display'
import { formatPatientAmount, getPatientDiseaseLabel } from '@/lib/patient-stats'

export const CLIENT_TABLE_SEARCH_PLACEHOLDER =
  'Search patient name, ID, disease, date, contact, address, amount...'

function formatPatientCreatedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return format(date, 'MMM d, yyyy')
}

export function buildPatientTableSearchText(patient: Patient): string {
  const diseaseLabels = patient.diseaseLabels?.filter(Boolean).join(', ') ?? ''

  return [
    getPatientDisplayName(patient),
    patient.firstName,
    patient.lastName,
    patient.rollNumber,
    getPatientDiseaseLabel(patient),
    diseaseLabels,
    patient.disease,
    patient.createdAt,
    formatPatientCreatedDate(patient.createdAt),
    patient.phone,
    patient.email,
    patient.address,
    patient.fees,
    formatPatientAmount(patient.fees),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function filterPatientsByTableSearch(patients: Patient[], search?: string): Patient[] {
  if (!search?.trim()) return patients
  const query = search.trim().toLowerCase()
  return patients.filter((patient) => buildPatientTableSearchText(patient).includes(query))
}
