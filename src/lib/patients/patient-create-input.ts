import { DEFAULT_MEDICINE_CATEGORIES, DEFAULT_MEDICINE_CATEGORY_ID } from '@/data/medicine-categories'
import type {
  PatientCreateInput,
  PatientDietItem,
  PatientEmergencyContacts,
  PatientPrescribedMedicine,
} from '@/types'

function trim(value: string | undefined | null): string {
  return value?.trim() ?? ''
}

function normalizePrescribedMedicines(
  rows: PatientPrescribedMedicine[] | undefined
): PatientPrescribedMedicine[] {
  if (!rows?.length) return []
  return rows.map((row) => {
    const normalized: PatientPrescribedMedicine = {
      medicineIds: row.medicineIds ?? [],
      medicineNames: row.medicineNames ?? [],
      formType: trim(row.formType),
      quantity: trim(row.quantity),
      dosage: trim(row.dosage) || undefined,
    }
    const medicineQuantityMl = trim(row.medicineQuantityMl)
    if (medicineQuantityMl) normalized.medicineQuantityMl = medicineQuantityMl
    const medicineQuantityUnit = trim(row.medicineQuantityUnit) as 'ml' | 'ltr' | ''
    if (medicineQuantityUnit === 'ml' || medicineQuantityUnit === 'ltr') {
      normalized.medicineQuantityUnit = medicineQuantityUnit
    }
    const quantityOther = trim(row.quantityOther)
    if (quantityOther) normalized.quantityOther = quantityOther
    const frequency = trim(row.frequency)
    if (frequency) normalized.frequency = frequency
    const frequencyOther = trim(row.frequencyOther)
    if (frequencyOther) normalized.frequencyOther = frequencyOther
    const timing = trim(row.timing)
    if (timing) normalized.timing = timing
    const timingOther = trim(row.timingOther)
    if (timingOther) normalized.timingOther = timingOther
    return normalized
  })
}

function normalizeDietPlan(items: PatientDietItem[] | undefined): PatientDietItem[] {
  if (!items?.length) return []
  return items
    .map((item) => ({
      item: trim(item.item),
      amount: trim(item.amount),
    }))
    .filter((item) => item.item && item.amount)
}

function normalizeEmergencyContacts(
  contacts: PatientEmergencyContacts | undefined
): PatientEmergencyContacts | undefined {
  if (!contacts) return undefined

  const normalized: PatientEmergencyContacts = {
    fatherName: trim(contacts.fatherName),
    fatherAadhar: trim(contacts.fatherAadhar),
    fatherMobile: trim(contacts.fatherMobile),
    motherName: trim(contacts.motherName),
    motherAadhar: trim(contacts.motherAadhar),
    motherMobile: trim(contacts.motherMobile),
  }

  const motherRelation = trim(contacts.motherRelation)
  if (motherRelation) normalized.motherRelation = motherRelation

  return normalized
}

/** Canonical POST body key order — sections 1–6, then clinical summary and system fields. */
export function orderPatientCreatePayload(data: PatientCreateInput): PatientCreateInput {
  return {
    // 1. Patient details
    admissionDate: data.admissionDate,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    address: data.address,
    dateOfBirth: data.dateOfBirth,
    guardian: data.guardian,
    parents: data.parents,
    rollNumber: data.rollNumber,
    email: data.email,
    year: data.year,
    status: data.status,

    // 2. Consultation
    diseases: data.diseases ?? [],
    diseaseLabels: data.diseaseLabels ?? [],
    disease: data.disease,
    prescription: data.prescription,

    // 3. Medicines
    prescribedMedicines: data.prescribedMedicines ?? [],

    // 4. Diet
    dietPlan: data.dietPlan ?? [],

    // 5. Additional notes
    additionalNotes: data.additionalNotes ?? '',

    // 6. Fees from patient
    fees: data.fees ?? '0',

    // Combined clinical summary (sections 1–6)
    notes: data.notes,

    // System / legacy fields
    classId: data.classId,
  }
}

/** Patient registration POST body shaped in form section order (1 → 6). */
export function normalizePatientCreateInput(raw: PatientCreateInput): PatientCreateInput {
  const patientNumber = trim(raw.rollNumber)
  const diseases = raw.diseases?.map((id) => trim(id)).filter(Boolean) ?? []
  const diseaseLabels = raw.diseaseLabels?.map((label) => trim(label)).filter(Boolean) ?? []
  const prescribedMedicines = normalizePrescribedMedicines(raw.prescribedMedicines)
  const dietPlan = normalizeDietPlan(raw.dietPlan)

  return orderPatientCreatePayload({
    // 1. Patient details
    admissionDate: trim(raw.admissionDate),
    firstName: trim(raw.firstName),
    lastName: trim(raw.lastName) || '-',
    phone: trim(raw.phone),
    address: trim(raw.address),
    dateOfBirth: trim(raw.dateOfBirth),
    guardian: {
      name: trim(raw.guardian?.name),
      phone: trim(raw.guardian?.phone),
      relation: trim(raw.guardian?.relation),
      ...(trim(raw.guardian?.email) ? { email: trim(raw.guardian?.email) } : {}),
    },
    parents: normalizeEmergencyContacts(raw.parents),
    rollNumber: patientNumber,
    email: trim(raw.email) || (patientNumber ? `${patientNumber.toLowerCase()}@patient.local` : ''),
    year: raw.year ?? new Date().getFullYear(),
    status: raw.status ?? 'active',

    // 2. Consultation
    diseases,
    diseaseLabels,
    disease: trim(raw.disease),
    prescription: trim(raw.prescription),

    // 3. Medicines
    prescribedMedicines,

    // 4. Diet
    dietPlan,

    // 5. Additional notes
    additionalNotes: trim(raw.additionalNotes),

    // 6. Fees from patient
    fees: trim(raw.fees) || '0',

    // Combined summary
    notes: trim(raw.notes),

    // System defaults
    classId: trim(raw.classId) || DEFAULT_MEDICINE_CATEGORY_ID,
  })
}

export function validatePatientCreateInput(data: PatientCreateInput): string | null {
  if (!data.admissionDate?.trim()) return 'Visit date is required'
  if (!data.firstName?.trim()) return 'Patient name is required'
  if (!data.diseases?.length && !data.disease?.trim()) return 'Select at least one disease'
  const hasMedicine = data.prescribedMedicines?.some((row) => row.medicineIds.length > 0)
  if (!hasMedicine) return 'Medicine name is required'
  return null
}

export function getDefaultMedicineCategoryId(): string {
  return DEFAULT_MEDICINE_CATEGORIES[0]?.id ?? DEFAULT_MEDICINE_CATEGORY_ID
}
