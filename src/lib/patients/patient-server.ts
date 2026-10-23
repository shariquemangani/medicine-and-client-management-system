import { DomainError } from '@/lib/api/api-error'
import {
  createFirestoreDocument,
  deleteFirestoreDocument,
  fetchPatientRecord,
  queryFirestoreEquals,
  queryLastWithPrefix,
  patchFirestoreDocument,
} from '@/lib/firebase/firestore-rest'
import { generateId } from '@/lib/list-utils'
import { buildPatientRollNumber, getPatientRollMonthStamp } from '@/lib/patients/patient-roll-number'
import { getMedicineCategoryName } from '@/data/medicine-categories'
import { buildPatientProfileDetail } from '@/lib/patients/patient-profile-detail'
import type {
  Payment,
  Patient,
  PatientCreateInput,
  PatientBillingSummary,
  PatientUpdateInput,
} from '@/types'
import type { PatientProfileData } from '@/types/patient-profile'

/** Firestore collection path segment for patient records. */
const PATIENTS_COLLECTION = 'patients'

function buildFeeSummary(
  patient: Patient,
  structures: { patientId: string; amount: number }[],
  payments: Payment[]
): PatientBillingSummary {
  const due = structures.filter((f) => f.patientId === patient.id).reduce((sum, f) => sum + f.amount, 0)
  const paid = payments.filter((p) => p.patientId === patient.id).reduce((sum, p) => sum + p.amount, 0)
  const patientPayments = payments
    .filter((p) => p.patientId === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const balance = due - paid
  return {
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    rollNumber: patient.rollNumber,
    className: patient.className,
    totalDue: due,
    totalPaid: paid,
    balance,
    lastPaymentDate: patientPayments[0]?.date,
    isOverdue: balance > 0,
  }
}

/** Fields a clinic user may change on a patient. Anything else in the request body is dropped. */
const EDITABLE_PATIENT_FIELDS = [
  'firstName', 'lastName', 'firstNameUr', 'lastNameUr', 'email', 'phone', 'classId', 'classSection',
  'year', 'status', 'dateOfBirth', 'aadharNumber', 'admissionDate', 'madrasaName', 'madrasaLocation',
  'address', 'bedNumber', 'schoolName', 'schoolLocation', 'schoolTiming', 'fees', 'guardian', 'parents',
  'notes', 'diseases', 'diseaseLabels', 'disease', 'prescription', 'prescribedMedicines', 'dietPlan',
  'additionalNotes', 'visitHistory',
] as const

const MAX_FIELD_TEXT = 5000

/** Whitelists editable fields, keeps the roll number and timestamps immutable, bounds text size. */
export function sanitizePatientUpdate(data: PatientUpdateInput, current: Pick<Patient, 'rollNumber'>): PatientUpdateInput {
  const input = data as Record<string, unknown>
  if (input.rollNumber !== undefined && input.rollNumber !== current.rollNumber) {
    throw new DomainError('The patient ID cannot be changed')
  }
  const clean: Record<string, unknown> = {}
  for (const key of EDITABLE_PATIENT_FIELDS) {
    const value = input[key]
    if (value === undefined) continue
    if (typeof value === 'string' && value.length > MAX_FIELD_TEXT) {
      throw new DomainError(`${key} is too long`)
    }
    clean[key] = value
  }
  return clean as PatientUpdateInput
}

async function addBusinessActivity(
  idToken: string,
  businessId: string,
  type: string,
  message: string
) {
  // Best-effort: the patient is already saved, so a failed feed entry must not fail the request
  // (a retry would register the patient twice).
  try {
    const id = generateId('act')
    await createFirestoreDocument(`businesses/${businessId}/activities/${id}`, idToken, {
      type,
      message,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('[activity] could not record feed entry', error)
  }
}

export async function createPatientRecord(
  idToken: string,
  businessId: string,
  data: PatientCreateInput
): Promise<Patient> {
  const id = generateId('pat')
  const now = new Date().toISOString()
  const visitDate = data.admissionDate?.trim() || data.dateOfBirth?.trim() || now.slice(0, 10)
  // Highest serial on a patient this month: one indexed read instead of listing everyone. Numbers
  // reserved by deleted patients are skipped by the collision loop below.
  const monthStamp = getPatientRollMonthStamp(visitDate)
  const lastOnPatient = await queryLastWithPrefix(
    `businesses/${businessId}/${PATIENTS_COLLECTION}`,
    idToken,
    'rollNumber',
    monthStamp
  )
  // Reserve the roll number by creating `rollNumbers/{roll}`: Firestore refuses a second create of
  // the same id, so two concurrent registrations can never end up with the same number.
  const taken = lastOnPatient ? [lastOnPatient] : []
  let rollNumber = ''
  for (let attempt = 0; attempt < 25 && !rollNumber; attempt++) {
    const candidate = buildPatientRollNumber(visitDate, taken)
    try {
      await createFirestoreDocument(`businesses/${businessId}/rollNumbers/${candidate}`, idToken, {
        patientId: id,
        createdAt: now,
      })
      rollNumber = candidate
    } catch (error) {
      if (!/already exists/i.test(error instanceof Error ? error.message : '')) throw error
      taken.push(candidate)
    }
  }
  if (!rollNumber) throw new DomainError('Could not allocate a patient ID. Please try again', 409)
  const className = getMedicineCategoryName(data.classId) ?? 'General'
  const patient: Patient = {
    ...data,
    id,
    rollNumber,
    email: data.email?.trim() || '',
    className,
    createdAt: now,
    updatedAt: now,
  }

  await createFirestoreDocument(
    `businesses/${businessId}/${PATIENTS_COLLECTION}/${id}`,
    idToken,
    patient
  )

  await addBusinessActivity(
    idToken,
    businessId,
    'patient_added',
    `Patient ${patient.firstName} ${patient.lastName === '-' ? '' : patient.lastName} registered (ID ${patient.rollNumber})`.replace('  ', ' ')
  )

  return patient
}

export async function fetchPatientProfileDetail(
  idToken: string,
  businessId: string,
  patientId: string
): Promise<PatientProfileData> {
  const patient = await fetchPatientRecord(idToken, businessId, patientId)
  if (!patient) {
    throw new DomainError('Patient not found', 404)
  }

  // Only collections that exist in the clinic data model and in firestore.rules are read.
  // (The old school `attendance` / `examResults` collections have no rules and carry no clinical data.)
  const [feeStructures, payments] = await Promise.all([
    queryFirestoreEquals<{ id: string; patientId: string; amount: number }>(
      `businesses/${businessId}/feeStructures`,
      idToken,
      'patientId',
      patientId
    ),
    queryFirestoreEquals<Payment>(`businesses/${businessId}/payments`, idToken, 'patientId', patientId),
  ])

  const feeSummary = buildFeeSummary(patient, feeStructures, payments)

  return buildPatientProfileDetail({
    patient,
    attendance: [],
    attendanceSummary: null,
    feeSummary,
    examResults: [],
  })
}

export async function updatePatientRecord(
  idToken: string,
  businessId: string,
  patientId: string,
  data: PatientUpdateInput
): Promise<Patient> {
  const current = await fetchPatientRecord(idToken, businessId, patientId)
  if (!current) {
    throw new DomainError('Patient not found', 404)
  }

  const now = new Date().toISOString()
  let className = current.className

  if (data.classId && data.classId !== current.classId) {
    className = getMedicineCategoryName(data.classId) ?? className
  }

  const updated: Patient = {
    ...current,
    ...sanitizePatientUpdate(data, current),
    id: patientId,
    className,
    updatedAt: now,
  }

  const patchData: Record<string, unknown> = { ...updated }
  delete patchData.id
  await patchFirestoreDocument(
    `businesses/${businessId}/${PATIENTS_COLLECTION}/${patientId}`,
    idToken,
    patchData as Record<string, unknown>
  )
  await addBusinessActivity(
    idToken,
    businessId,
    'patient_updated',
    `Patient ${updated.firstName} ${updated.lastName === '-' ? '' : updated.lastName} updated (ID ${updated.rollNumber})`.replace('  ', ' ')
  )
  return updated
}

export async function deletePatientRecord(
  idToken: string,
  businessId: string,
  patientId: string
): Promise<void> {
  const patient = await fetchPatientRecord(idToken, businessId, patientId)
  if (!patient) {
    throw new DomainError('Patient not found', 404)
  }

  await deleteFirestoreDocument(`businesses/${businessId}/${PATIENTS_COLLECTION}/${patientId}`, idToken)
  await addBusinessActivity(
    idToken,
    businessId,
    'patient_removed',
    `Patient ${patient.firstName} ${patient.lastName === '-' ? '' : patient.lastName} removed (ID ${patient.rollNumber})`.replace('  ', ' ')
  )
}
