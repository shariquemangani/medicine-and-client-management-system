import {
  createFirestoreDocument,
  deleteFirestoreDocument,
  fetchFirestoreCollection,
  fetchFirestoreDocument,
  fetchPatientRecord,
  patchFirestoreDocument,
} from '@/lib/firebase/firestore-rest'
import { generateId } from '@/lib/list-utils'
import { buildPatientRollNumber } from '@/lib/patients/patient-roll-number'
import { getMedicineCategoryName } from '@/data/medicine-categories'
import { buildPatientProfileDetail } from '@/lib/patients/patient-profile-detail'
import type {
  InventoryRecord,
  InventorySummary,
  PrescriptionItem,
  Payment,
  Medicine,
  Patient,
  PatientCreateInput,
  PatientBillingSummary,
  PatientUpdateInput,
} from '@/types'
import type { PatientProfileData } from '@/types/patient-profile'

/** Firestore collection path segment for patient records. */
const PATIENTS_COLLECTION = 'patients'

function buildInventorySummary(records: InventoryRecord[]): InventorySummary[] {
  const byPatient = new Map<string, InventorySummary>()
  for (const r of records) {
    const existing = byPatient.get(r.patientId) ?? {
      patientId: r.patientId,
      patientName: r.patientName,
      rollNumber: r.rollNumber,
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    }
    existing.total += 1
    if (r.status === 'present') existing.present += 1
    else if (r.status === 'absent') existing.absent += 1
    else if (r.status === 'late') existing.late += 1
    byPatient.set(r.patientId, existing)
  }
  return Array.from(byPatient.values())
}

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

async function addBusinessActivity(
  idToken: string,
  businessId: string,
  type: string,
  message: string
) {
  const id = generateId('act')
  const now = new Date().toISOString()
  await createFirestoreDocument(`businesses/${businessId}/activities/${id}`, idToken, {
    type,
    message,
    timestamp: now,
  })
}

export async function createPatientRecord(
  idToken: string,
  businessId: string,
  data: PatientCreateInput
): Promise<Patient> {
  const id = generateId('pat')
  const now = new Date().toISOString()
  const visitDate = data.admissionDate?.trim() || data.dateOfBirth?.trim() || now.slice(0, 10)
  const existingPatients = await fetchFirestoreCollection<Patient>(
    `businesses/${businessId}/${PATIENTS_COLLECTION}`,
    idToken
  )
  const rollNumber = buildPatientRollNumber(
    visitDate,
    existingPatients.map((patient) => patient.rollNumber)
  )
  const medicineCategory = await fetchFirestoreDocument<Medicine>(
    `businesses/${businessId}/classes/${data.classId}`,
    idToken
  )
  const className = medicineCategory?.name ?? getMedicineCategoryName(data.classId) ?? 'General'
  const patient: Patient = {
    ...data,
    id,
    rollNumber,
    email: `${rollNumber}@patient.local`,
    className,
    createdAt: now,
    updatedAt: now,
  }

  await createFirestoreDocument(
    `businesses/${businessId}/${PATIENTS_COLLECTION}/${id}`,
    idToken,
    patient as unknown as Record<string, unknown>
  )

  if (medicineCategory) {
    await patchFirestoreDocument(`businesses/${businessId}/classes/${medicineCategory.id}`, idToken, {
      patientIds: [...(medicineCategory.patientIds ?? []), id],
      updatedAt: now,
    })
  }

  await addBusinessActivity(
    idToken,
    businessId,
    'patient_added',
    `Patient ${patient.firstName} ${patient.lastName} registered under ${patient.className}`
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
    throw new Error('Patient not found')
  }

  const [attendance, examResults, feeStructures, payments] = await Promise.all([
    fetchFirestoreCollection<InventoryRecord>(`businesses/${businessId}/attendance`, idToken),
    fetchFirestoreCollection<PrescriptionItem>(`businesses/${businessId}/examResults`, idToken),
    fetchFirestoreCollection<{ id: string; patientId: string; amount: number }>(
      `businesses/${businessId}/feeStructures`,
      idToken
    ),
    fetchFirestoreCollection<Payment>(`businesses/${businessId}/payments`, idToken),
  ])

  const patientAttendance = attendance.filter((a) => a.patientId === patientId)
  const summaries = buildInventorySummary(patientAttendance)
  const feeSummary = buildFeeSummary(patient, feeStructures, payments)
  const patientPrescriptions = examResults.filter((r) => r.patientId === patientId)

  return buildPatientProfileDetail({
    patient: patient,
    attendance: patientAttendance,
    attendanceSummary: summaries[0] ?? null,
    feeSummary,
    examResults: patientPrescriptions,
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
    throw new Error('Patient not found')
  }

  const now = new Date().toISOString()
  let className = current.className

  if (data.classId && data.classId !== current.classId) {
    const classes = await fetchFirestoreCollection<Medicine>(`businesses/${businessId}/classes`, idToken)
    const oldCls = classes.find((c) => c.id === current.classId)
    const newCls = classes.find((c) => c.id === data.classId)

    if (oldCls) {
      await patchFirestoreDocument(`businesses/${businessId}/classes/${oldCls.id}`, idToken, {
        patientIds: (oldCls.patientIds ?? []).filter((sid) => sid !== patientId),
        updatedAt: now,
      })
    }
    if (newCls) {
      await patchFirestoreDocument(`businesses/${businessId}/classes/${newCls.id}`, idToken, {
        patientIds: [...(newCls.patientIds ?? []), patientId],
        updatedAt: now,
      })
      className = newCls.name
    } else if (data.classId) {
      className = getMedicineCategoryName(data.classId) ?? className
    }
  }

  const updated: Patient = {
    ...current,
    ...data,
    id: patientId,
    className,
    updatedAt: now,
  }

  const { id: _id, ...patchData } = updated
  await patchFirestoreDocument(
    `businesses/${businessId}/${PATIENTS_COLLECTION}/${patientId}`,
    idToken,
    patchData as Record<string, unknown>
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
    throw new Error('Patient not found')
  }

  const now = new Date().toISOString()

  if (patient.classId) {
    const cls = await fetchFirestoreDocument<Medicine>(
      `businesses/${businessId}/classes/${patient.classId}`,
      idToken
    )
    if (cls) {
      await patchFirestoreDocument(`businesses/${businessId}/classes/${cls.id}`, idToken, {
        patientIds: (cls.patientIds ?? []).filter((sid) => sid !== patientId),
        updatedAt: now,
      })
    }
  }

  await deleteFirestoreDocument(`businesses/${businessId}/${PATIENTS_COLLECTION}/${patientId}`, idToken)
}
