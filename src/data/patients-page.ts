import type { PatientDirectoryFilters } from '@/types/patient-page'
import type { Medicine } from '@/types'

export const patientQuickFilters: {
  label: string
  labelKey: string
  patch: Partial<PatientDirectoryFilters>
  accent: string
}[] = [
  {
    label: 'Total Patients',
    labelKey: 'patients.totalPatients',
    patch: { status: 'all', classId: 'all' },
    accent: 'patients',
  },
]

export function getPatientInitials(firstName: string, lastName: string) {
  const first = firstName.charAt(0)
  const second = lastName ? lastName.charAt(0) : firstName.charAt(1) || first
  return `${first}${second}`.toUpperCase()
}

export function formatPatientClassLabel(classes: (Medicine & { patientCount?: number })[]) {
  return classes.map((c) => ({
    id: c.id,
    label: c.name,
    count: c.patientCount ?? 0,
  }))
}
