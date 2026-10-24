import { splitPatientName } from '@/lib/patient-form-schema'
import {
  buildClinicalNotes,
  formatMedicineDosage,
  getDefaultMedicineRow,
  type PatientRegistrationFormValues,
} from '@/lib/patient-registration-schema'
import { todayIsoDate } from '@/lib/date-select-utils'
import { generateId } from '@/lib/list-utils'
import type { Patient, PatientPrescribedMedicine, PatientUpdateInput } from '@/types'
import type { PatientVisitRecord } from '@/types/patient-visit'
import {
  getFormTypeLabel,
  getFrequencyLabel,
  getMedicineVolumeUnitLabel,
  getTimingLabel,
  usesNumericQuantity,
} from '@/data/prescription-options'

function mapMedicineToRow(
  medicine: NonNullable<Patient['prescribedMedicines']>[number]
): PatientRegistrationFormValues['medicines'][number] {
  return {
    medicineIds: medicine.medicineIds ?? [],
    medicineNames: medicine.medicineNames ?? [],
    medicineQuantityMl: medicine.medicineQuantityMl ?? '',
    medicineQuantityUnit: medicine.medicineQuantityUnit ?? 'ml',
    formType: medicine.formType ?? '',
    quantity: medicine.quantity ?? '',
    quantityOther: medicine.quantityOther ?? '',
    frequency: medicine.frequency ?? '',
    frequencyOther: medicine.frequencyOther ?? '',
    timing: medicine.timing ?? '',
    timingOther: medicine.timingOther ?? '',
  }
}

export function clientToRegistrationValues(patient: Patient): PatientRegistrationFormValues {
  const visitDate = patient.admissionDate?.trim() || patient.dateOfBirth?.trim() || todayIsoDate()
  const patientName =
    `${patient.firstName} ${patient.lastName}`.trim() || patient.guardian?.name?.trim() || ''
  const medicines =
    patient.prescribedMedicines && patient.prescribedMedicines.length > 0
      ? patient.prescribedMedicines.map(mapMedicineToRow)
      : [getDefaultMedicineRow()]

  return {
    visitDate,
    patientName,
    contact: patient.phone ?? '',
    address: patient.address ?? '',
    diseases: patient.diseases ?? [],
    prescription: patient.prescription ?? '',
    medicines,
    dietItems: patient.dietPlan ?? [],
    additionalNotes: patient.additionalNotes ?? '',
    patientFees: patient.fees?.trim() ?? '',
  }
}

export function createVisitSnapshotFromPatient(patient: Patient): PatientVisitRecord {
  return {
    id: generateId('visit'),
    visitDate: patient.admissionDate?.trim() || patient.dateOfBirth?.trim() || todayIsoDate(),
    recordedAt: new Date().toISOString(),
    diseases: [...(patient.diseases ?? [])],
    diseaseLabels: [...(patient.diseaseLabels ?? [])],
    disease: patient.disease,
    prescription: patient.prescription,
    prescribedMedicines: [...(patient.prescribedMedicines ?? [])],
    dietPlan: [...(patient.dietPlan ?? [])],
    additionalNotes: patient.additionalNotes,
    fees: patient.fees,
    summary: patient.notes,
  }
}

export function registrationValuesToPatientUpdate(
  values: PatientRegistrationFormValues,
  diseaseOptions: { value: string; label: string }[] = [],
  options?: { appendVisitFrom?: Patient | null }
): PatientUpdateInput {
  const diseaseLabelMap = Object.fromEntries(diseaseOptions.map((o) => [o.value, o.label]))
  const visitDate = values.visitDate.trim() || todayIsoDate()
  const patientName = values.patientName.trim() || 'Patient'
  const { firstName, lastName } = splitPatientName(patientName)
  const diseaseLabels = values.diseases.map((id) => diseaseLabelMap[id] ?? id)
  const diseaseSummary = diseaseLabels.join(', ')

  const hasMedicineRowData = (row: PatientRegistrationFormValues['medicines'][number]) =>
    row.medicineIds.length > 0 ||
    Boolean(row.formType?.trim()) ||
    Boolean(row.quantity?.trim()) ||
    Boolean(row.medicineQuantityMl?.trim())

  const prescribedMedicines = values.medicines.filter(hasMedicineRowData).map((row) => ({
    medicineIds: row.medicineIds,
    medicineNames: row.medicineNames,
    medicineQuantityMl: row.medicineQuantityMl?.trim() || undefined,
    medicineQuantityUnit: row.medicineQuantityUnit ?? 'ml',
    formType: row.formType ?? '',
    quantity: row.quantity ?? '',
    quantityOther: row.quantityOther?.trim() || undefined,
    frequency: row.frequency || undefined,
    frequencyOther: row.frequencyOther?.trim() || undefined,
    timing: row.timing || undefined,
    timingOther: row.timingOther?.trim() || undefined,
    dosage: formatMedicineDosage(row),
  }))

  const dietPlan = values.dietItems
    .map((item) => ({ item: item.item.trim(), amount: item.amount.trim() }))
    .filter((item) => item.item && item.amount)

  const update: PatientUpdateInput = {
    admissionDate: visitDate,
    dateOfBirth: visitDate,
    firstName: firstName || 'Patient',
    lastName: lastName || '-',
    phone: values.contact.trim(),
    address: values.address.trim(),
    year: Number(visitDate.slice(0, 4)) || new Date().getFullYear(),
    guardian: {
      name: patientName,
      phone: values.contact.trim(),
      relation: 'Self',
    },
    diseases: [...values.diseases],
    diseaseLabels,
    disease: diseaseSummary,
    prescription: values.prescription.trim(),
    prescribedMedicines,
    dietPlan,
    additionalNotes: values.additionalNotes.trim(),
    fees: values.patientFees.trim() || '0',
    notes: buildClinicalNotes(values, diseaseLabels),
  }

  if (options?.appendVisitFrom) {
    const snapshot = createVisitSnapshotFromPatient(options.appendVisitFrom)
    const existing = options.appendVisitFrom.visitHistory ?? []
    update.visitHistory = [snapshot, ...existing]
  }

  return update
}

export function formatPrescribedMedicineDisplay(
  medicine: PatientPrescribedMedicine,
  options: { withNames?: boolean } = {}
): string {
  if (medicine.dosage?.trim()) {
    const dosage = medicine.dosage.trim()
    const names = medicine.medicineNames?.join(', ') ?? ''
    // Stored dosage text starts with the medicine name; callers that already show the name drop it.
    if (options.withNames === false && names && dosage.startsWith(names)) {
      return dosage.slice(names.length).replace(/^[\s·,-]+/, '') || dosage
    }
    return dosage
  }
  const names = options.withNames === false ? '' : (medicine.medicineNames?.join(', ') ?? '')
  const form = medicine.formType ? getFormTypeLabel(medicine.formType) : ''
  const qty = medicine.formType
    ? usesNumericQuantity(medicine.formType)
      ? medicine.quantity
      : medicine.quantityOther
    : ''
  const parts = [
    names,
    medicine.medicineQuantityMl?.trim()
      ? `${medicine.medicineQuantityMl.trim()} ${getMedicineVolumeUnitLabel(medicine.medicineQuantityUnit ?? 'ml')}`
      : '',
    form,
    qty ? `Qty: ${qty}` : '',
  ]
  if (medicine.frequency) {
    parts.push(getFrequencyLabel(medicine.frequency, medicine.frequencyOther))
  }
  if (medicine.timing) {
    parts.push(getTimingLabel(medicine.timing, medicine.timingOther))
  }
  return parts.filter(Boolean).join(' · ') || 'Medicine'
}
