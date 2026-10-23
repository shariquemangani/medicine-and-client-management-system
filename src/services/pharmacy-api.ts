import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  getCount,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore/lite'
import { db } from '@/lib/firebase/app'
import { requireBusinessId } from '@/lib/firebase/business-context'
import { filterBySearch, generateId, paginate } from '@/lib/list-utils'
import type {
  AdminUser,
  DashboardData,
  Prescription,
  PrescriptionCreateInput,
  PrescriptionItem,
  BillingCategory,
  PaginatedResponse,
  Payment,
  Medicine,
  MedicineCreateInput,
  BusinessProfile,
  AcademicConfig,
  Patient,
  PatientBillingSummary,
  SubjectMark,
  Staff,
  AdminUserCreateInput,
  AdminUserUpdateInput,
  MedicineUpdateInput,
} from '@/types'

function schoolPath(businessId: string, ...segments: string[]) {
  return ['businesses', businessId, ...segments].join('/')
}

function asFirestoreUpdate(data: object): DocumentData {
  return data as DocumentData
}

function colRef(businessId: string, name: string) {
  return collection(db, 'businesses', businessId, name)
}

async function getSchoolDoc(businessId: string) {
  const snap = await getDoc(doc(db, 'businesses', businessId))
  return snap.exists() ? snap.data() : null
}

async function listCollection<T>(businessId: string, name: string): Promise<T[]> {
  const snap = await getDocs(colRef(businessId, name))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)
}

/**
 * Best-effort audit/feed entry. The primary write has already succeeded, so a failure here must
 * not surface as "failed" (a retry would duplicate the payment/patient/medicine).
 */
async function addActivity(businessId: string, type: string, message: string) {
  try {
    const id = generateId('act')
    await setDoc(doc(db, schoolPath(businessId, 'activities', id)), {
      type,
      message,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('[activity] could not record feed entry', error)
  }
}

// ── Patients ────────────────────────────────────────────────────────────────

export const getPatient = async (id: string): Promise<Patient> => {
  const businessId = requireBusinessId()
  const snap = await getDoc(doc(db, schoolPath(businessId, 'patients', id)))
  if (!snap.exists()) throw new Error('Not found')
  return { id: snap.id, ...snap.data() } as Patient
}

// ── Staffs ────────────────────────────────────────────────────────────────

export const fetchStaff = async (id: string): Promise<Staff> => {
  const businessId = requireBusinessId()
  const snap = await getDoc(doc(db, schoolPath(businessId, 'staff', id)))
  if (!snap.exists()) throw new Error('Not found')
  return { id: snap.id, ...snap.data() } as Staff
}

// ── Classes ─────────────────────────────────────────────────────────────────

// Dropdowns on several screens (new patient, patient detail, prescriptions) need the same list;
// share one read per clinic for a minute. Medicine writes below clear it.
const MEDICINES_FRESH_MS = 60_000
let medicinesCache: { businessId: string; at: number; promise: Promise<Medicine[]> } | null = null

function invalidateMedicinesCache() {
  medicinesCache = null
}

function listMedicinesCached(businessId: string): Promise<Medicine[]> {
  if (medicinesCache && medicinesCache.businessId === businessId && Date.now() - medicinesCache.at < MEDICINES_FRESH_MS) {
    return medicinesCache.promise
  }
  const promise = listCollection<Medicine>(businessId, 'medicines')
  const entry = { businessId, at: Date.now(), promise }
  medicinesCache = entry
  promise.catch(() => {
    if (medicinesCache === entry) medicinesCache = null
  })
  return promise
}

export async function fetchMedicines(params?: {
  search?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Medicine & { patientCount: number }>> {
  const businessId = requireBusinessId()
  let result = (await listMedicinesCached(businessId)).map((c) => ({
    ...c,
    patientCount: c.patientIds?.length ?? 0,
  }))
  if (params?.search) {
    result = filterBySearch(result, params.search, [
      'name',
      'commonName',
      'abbreviation',
      'information',
      'scheduleSummary',
      'categoryName',
      'keynotes',
      'grade',
      'section',
    ])
  }
  const paged = paginate(result, params?.page, params?.limit)
  return {
    data: paged.data,
    meta: {
      total: paged.total,
      page: paged.page,
      limit: paged.limit,
      totalPages: paged.totalPages,
    },
  }
}

export async function getMedicine(id: string) {
  const businessId = requireBusinessId()
  const snap = await getDoc(doc(db, schoolPath(businessId, 'medicines', id)))
  if (!snap.exists()) throw new Error('Not found')
  const medicine = { id: snap.id, ...snap.data() } as Medicine
  const [patients, teachers] = await Promise.all([
    listCollection<Patient>(businessId, 'patients'),
    listCollection<Staff>(businessId, 'staff'),
  ])
  return {
    ...medicine,
    patients: patients.filter((s) => (medicine.patientIds ?? []).includes(s.id)),
    subjectStaffs: teachers.filter((t) => (medicine.subjectStaffIds ?? []).includes(t.id)),
  }
}

export async function createMedicine(data: MedicineCreateInput): Promise<Medicine> {
  const businessId = requireBusinessId()
  const name = data.name?.trim() ?? ''
  if (!name) throw new Error('Medicine name is required')
  if (name.length > 120) throw new Error('Medicine name must be 120 characters or fewer')
  const existing = await listCollection<Medicine>(businessId, 'medicines')
  if (existing.some((m) => m.name?.trim().toLowerCase() === name.toLowerCase())) {
    throw new Error('A medicine with this name already exists')
  }
  const id = generateId('med')
  const now = new Date().toISOString()

  // Persist fields in Add Medicine section order (identity → potencies → symptoms → safety).
  const medicine: Medicine = {
    id,
    name,
    commonName: data.commonName,
    formType: data.formType,
    status: data.status,
    potencies: data.potencies,
    symptoms: data.symptoms,
    information: data.information,
    antidotes: data.antidotes,
    cautionNotes: data.cautionNotes,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(doc(db, schoolPath(businessId, 'medicines', id)), medicine)
  invalidateMedicinesCache()
  await addActivity(businessId, 'medicine_added', `Medicine added: ${medicine.name}`)
  return medicine
}

export async function updateMedicine(id: string, data: MedicineUpdateInput): Promise<Medicine> {
  const businessId = requireBusinessId()
  const ref = doc(db, schoolPath(businessId, 'medicines', id))
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Not found')
  const current = snap.data() as Medicine

  const updated: Medicine = {
    ...current,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  }

  await updateDoc(ref, asFirestoreUpdate(updated))
  invalidateMedicinesCache()
  return updated
}

export async function deleteMedicine(id: string): Promise<{ success: boolean }> {
  const businessId = requireBusinessId()
  await deleteDoc(doc(db, schoolPath(businessId, 'medicines', id)))
  invalidateMedicinesCache()
  return { success: true }
}

// ── Prescriptions ───────────────────────────────────────────────────────────────────

export async function fetchPrescriptions(): Promise<Prescription[]> {
  const businessId = requireBusinessId()
  return listCollection<Prescription>(businessId, 'prescriptions')
}

export async function createPrescription(data: PrescriptionCreateInput): Promise<Prescription> {
  const businessId = requireBusinessId()
  const id = generateId('exam')
  const now = new Date().toISOString()
  const exam: Prescription = { ...data, id, createdAt: now }
  await setDoc(doc(db, schoolPath(businessId, 'prescriptions', id)), exam)
  return exam
}

export async function fetchPrescriptionItems(examId: string, classId?: string) {
  const businessId = requireBusinessId()
  let result = (await listCollection<PrescriptionItem>(businessId, 'prescriptionItems')).filter(
    (r) => r.examId === examId
  )
  if (classId) result = result.filter((r) => r.classId === classId)
  return result
}

export async function savePrescriptionItems(
  examId: string,
  classId: string,
  results: { patientId: string; marks: SubjectMark[] }[]
): Promise<PrescriptionItem[]> {
  const businessId = requireBusinessId()
  const exams = await listCollection<Prescription>(businessId, 'prescriptions')
  const patients = await listCollection<Patient>(businessId, 'patients')
  const exam = exams.find((e) => e.id === examId)
  if (!exam) return []

  const existing = await listCollection<PrescriptionItem>(businessId, 'prescriptionItems')
  const saved: PrescriptionItem[] = []

  for (const r of results) {
    const patient = patients.find((s) => s.id === r.patientId)
    if (!patient) continue
    const total = r.marks.reduce((s, m) => s + m.score, 0)
    const maxTotal = r.marks.reduce((s, m) => s + m.maxScore, 0)
    const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0
    const passThreshold = exam.maxScore > 0 ? (exam.passScore / exam.maxScore) * 100 : 0

    const prior = existing.find((er) => er.examId === examId && er.patientId === r.patientId)
    const id = prior?.id ?? generateId('res')
    const result: PrescriptionItem = {
      id,
      examId,
      patientId: r.patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      rollNumber: patient.rollNumber,
      classId,
      marks: r.marks,
      total,
      maxTotal,
      percentage,
      status: percentage >= passThreshold ? 'pass' : 'fail',
    }
    await setDoc(doc(db, schoolPath(businessId, 'prescriptionItems', id)), result)
    saved.push(result)
  }

  await addActivity(businessId, 'exam_results', `Results updated for ${exam.name}`)
  return saved
}

// ── Fees ────────────────────────────────────────────────────────────────────

export async function fetchFeeCategories(): Promise<BillingCategory[]> {
  const businessId = requireBusinessId()
  return listCollection<BillingCategory>(businessId, 'billingCategories')
}

export async function fetchPatientFeeSummaries(overdueOnly?: boolean): Promise<PatientBillingSummary[]> {
  const businessId = requireBusinessId()
  const [patients, structures, payments] = await Promise.all([
    listCollection<Patient>(businessId, 'patients'),
    listCollection<import('@/types').FeeStructure>(businessId, 'feeStructures'),
    listCollection<Payment>(businessId, 'payments'),
  ])

  // Group once (O(patients + payments)) instead of filtering every list per patient.
  const dueByPatient = new Map<string, number>()
  for (const f of structures) if (f.patientId) dueByPatient.set(f.patientId, (dueByPatient.get(f.patientId) ?? 0) + f.amount)
  const paidByPatient = new Map<string, { total: number; lastDate?: string }>()
  for (const p of payments) {
    if (!p.patientId) continue
    const entry = paidByPatient.get(p.patientId) ?? { total: 0 }
    entry.total += p.amount
    if (!entry.lastDate || p.date.localeCompare(entry.lastDate) > 0) entry.lastDate = p.date
    paidByPatient.set(p.patientId, entry)
  }

  const summaries: PatientBillingSummary[] = patients.map((s) => {
    const due = dueByPatient.get(s.id) ?? 0
    const paid = paidByPatient.get(s.id)
    const balance = due - (paid?.total ?? 0)
    return {
      patientId: s.id,
      patientName: `${s.firstName} ${s.lastName}`,
      rollNumber: s.rollNumber,
      className: s.className,
      totalDue: due,
      totalPaid: paid?.total ?? 0,
      balance,
      lastPaymentDate: paid?.lastDate,
      isOverdue: balance > 0,
    }
  })

  if (overdueOnly) return summaries.filter((s) => s.isOverdue && s.balance > 0)
  return summaries
}

export async function recordPayment(data: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  const businessId = requireBusinessId()
  const id = generateId('pay')
  const payment: Payment = { ...data, id, createdAt: new Date().toISOString() }
  await setDoc(doc(db, schoolPath(businessId, 'payments', id)), payment)
  await addActivity(
    businessId,
    'payment_received',
    `Payment of ₹${payment.amount.toLocaleString('en-IN')} received from ${payment.patientName}`
  )
  return payment
}

// ── Dashboard ───────────────────────────────────────────────────────────────

/**
 * Active team members of this clinic. Only a super admin may list `users` (see firestore.rules),
 * so for staff accounts this returns null and the dashboard hides the tile.
 */
async function countTeamMembers(businessId: string): Promise<number | null> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('businessId', '==', businessId)))
    return snap.docs.filter((d) => d.data().isActive !== false).length
  } catch {
    return null
  }
}

async function countWhere(businessId: string, name: string, ...constraints: Parameters<typeof where>[]) {
  const q = constraints.length
    ? query(colRef(businessId, name), ...constraints.map((c) => where(...c)))
    : colRef(businessId, name)
  const snap = await getCount(q)
  return snap.data().count
}

/** Patients registered before the end of each of the last 6 months (server-side counts, 6 cheap reads). */
async function buildPatientTrend(businessId: string, activeNow: number): Promise<DashboardData['enrollmentTrend']> {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
    return {
      monthEnd,
      label: new Date(monthEnd.getFullYear(), monthEnd.getMonth() - 1, 1).toLocaleString('en', { month: 'short' }),
    }
  })
  const counts = await Promise.all(
    months.map(({ monthEnd }, i) =>
      i === months.length - 1 ? Promise.resolve(activeNow) : countWhere(businessId, 'patients', ['createdAt', '<', monthEnd.toISOString()])
    )
  )
  return months.map((m, i) => ({ month: m.label, count: counts[i] }))
}

export async function getDashboardStats(): Promise<DashboardData> {
  const businessId = requireBusinessId()
  const now = new Date()
  // Compare the YYYY-MM prefix: payment dates are date-only strings (no timezone surprises).
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Counts are computed by Firestore and only this month's payments are read, so the dashboard
  // costs a handful of reads no matter how many patients or medicines the clinic has.
  const [activeCount, teachers, medicineCount, feesThisMonth, activities] = await Promise.all([
    countWhere(businessId, 'patients', ['status', '==', 'active']),
    countTeamMembers(businessId),
    countWhere(businessId, 'medicines'),
    // Only this month's payments are read (a single-field range needs no composite index; a
    // server-side sum() over a range would).
    getDocs(
      query(colRef(businessId, 'payments'), where('date', '>=', monthKey), where('date', '<', `${monthKey}￿`))
    ).then((snap) => snap.docs.reduce((total, d) => total + (Number(d.data().amount) || 0), 0)),
    getDocs(query(colRef(businessId, 'activities'), orderBy('timestamp', 'desc'), limit(8))).then((snap) =>
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as { id: string; type: string; message: string; timestamp: string })
    ),
  ])
  const enrollmentTrend = await buildPatientTrend(businessId, activeCount)

  return {
    stats: {
      totalPatients: activeCount,
      totalStaffs: teachers,
      totalClasses: medicineCount,
      feesCollectedThisMonth: feesThisMonth,
    },
    enrollmentTrend,
    recentActivities: activities
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        type: a.type as DashboardData['recentActivities'][0]['type'],
        message: a.message,
        timestamp: a.timestamp,
      })),
  }
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function fetchBusinessProfile(): Promise<BusinessProfile> {
  const businessId = requireBusinessId()
  const data = await getSchoolDoc(businessId)
  return (data?.profile as BusinessProfile) ?? {
    name: '',
    logoUrl: '',
    address: '',
    phone: '',
    email: '',
  }
}

export async function updateBusinessProfile(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
  const businessId = requireBusinessId()
  const ref = doc(db, 'businesses', businessId)
  const current = await getSchoolDoc(businessId)
  const profile = { ...(current?.profile as BusinessProfile), ...data }
  await updateDoc(ref, { profile })
  return profile
}

export async function fetchAcademicConfig(): Promise<AcademicConfig> {
  const businessId = requireBusinessId()
  const data = await getSchoolDoc(businessId)
  return (
    (data?.academicConfig as AcademicConfig) ?? {
      academicYear: '',
      currentTerm: '',
      terms: [],
    }
  )
}

export async function updateAcademicConfig(data: Partial<AcademicConfig>): Promise<AcademicConfig> {
  const businessId = requireBusinessId()
  const ref = doc(db, 'businesses', businessId)
  const current = await getSchoolDoc(businessId)
  const academicConfig = { ...(current?.academicConfig as AcademicConfig), ...data }
  await updateDoc(ref, { academicConfig })
  return academicConfig
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const businessId = requireBusinessId()
  const q = query(collection(db, 'users'), where('businessId', '==', businessId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AdminUser)
}

export async function createAdminUser(data: AdminUserCreateInput): Promise<AdminUser> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Failed to create user')
  return json.data as AdminUser
}

export async function updateAdminUser(id: string, data: AdminUserUpdateInput): Promise<AdminUser> {
  // Goes through the Admin API so disabling also disables the Firebase Auth account and
  // revokes sessions; role/email changes are not supported here.
  const body: { name?: string; isActive?: boolean } = {}
  if (data.name !== undefined) body.name = data.name
  if (data.isActive !== undefined) body.isActive = data.isActive

  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message ?? 'Failed to update user')
  return json.data as AdminUser
}
