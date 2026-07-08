import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/app'
import { requireBusinessId } from '@/lib/firebase/business-context'
import { filterBySearch, generateId, paginate } from '@/lib/list-utils'
import { getMedicineCategoryName } from '@/data/medicine-categories'
import type {
  AdminUser,
  InventoryBulkInput,
  InventoryRecord,
  InventorySummary,
  DashboardData,
  Prescription,
  PrescriptionCreateInput,
  PrescriptionItem,
  PrescriptionUpdateInput,
  BillingCategory,
  PaginatedResponse,
  Payment,
  Medicine,
  MedicineCreateInput,
  BusinessProfile,
  AcademicConfig,
  Patient,
  PatientCreateInput,
  PatientBillingSummary,
  PatientUpdateInput,
  SubjectMark,
  Staff,
  StaffCreateInput,
  StaffUpdateInput,
  AdminUserCreateInput,
  AdminUserUpdateInput,
  MedicineUpdateInput,
} from '@/types'
import type { PatientProfileData } from '@/types/patient-profile'
import { buildPatientProfileDetail } from '@/lib/patients/patient-profile-detail'

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

async function addActivity(businessId: string, type: string, message: string) {
  const id = generateId('act')
  await setDoc(doc(db, schoolPath(businessId, 'activities', id)), {
    type,
    message,
    timestamp: new Date().toISOString(),
  })
}

// ── Patients ────────────────────────────────────────────────────────────────

export async function fetchPatients(params?: {
  search?: string
  classId?: string
  status?: string
  year?: number
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Patient>> {
  const businessId = requireBusinessId()
  let result = await listCollection<Patient>(businessId, 'patients')

  if (params?.classId) result = result.filter((s) => s.classId === params.classId)
  if (params?.status) result = result.filter((s) => s.status === params.status)
  if (params?.year) result = result.filter((s) => s.year === params.year)
  result = filterBySearch(result, params?.search, [
    'firstName',
    'lastName',
    'rollNumber',
    'email',
  ])

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

export const getPatient = async (id: string): Promise<Patient> => {
  const businessId = requireBusinessId()
  const snap = await getDoc(doc(db, schoolPath(businessId, 'patients', id)))
  if (!snap.exists()) throw new Error('Not found')
  return { id: snap.id, ...snap.data() } as Patient
}

export async function fetchPatientProfile(id: string): Promise<PatientProfileData> {
  const businessId = requireBusinessId()
  const patient = await getPatient(id)
  const [attendance, examResults, feeSummaries] = await Promise.all([
    listCollection<InventoryRecord>(businessId, 'inventory'),
    listCollection<PrescriptionItem>(businessId, 'prescriptionItems'),
    fetchPatientFeeSummaries(),
  ])

  const patientAttendance = attendance.filter((a) => a.patientId === id)
  const summaries = buildInventorySummary(patientAttendance)
  const feeSummary = feeSummaries.find((f) => f.patientId === id) ?? null

  const patientPrescriptions = examResults.filter((r) => r.patientId === id)

  return buildPatientProfileDetail({
    patient,
    attendance: patientAttendance,
    attendanceSummary: summaries[0] ?? null,
    feeSummary,
    examResults: patientPrescriptions,
  })
}

export async function createPatient(data: PatientCreateInput): Promise<Patient> {
  const businessId = requireBusinessId()
  const classes = await listCollection<Medicine>(businessId, 'medicines')
  const cls = classes.find((c) => c.id === data.classId)
  const id = generateId('cli')
  const now = new Date().toISOString()
  const className = cls?.name ?? getMedicineCategoryName(data.classId) ?? 'Unassigned'
  const patient: Patient = {
    ...data,
    id,
    className,
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(doc(db, schoolPath(businessId, 'patients', id)), patient)

  if (cls) {
    await updateDoc(doc(db, schoolPath(businessId, 'medicines', cls.id)), {
      patientIds: [...(cls.patientIds ?? []), id],
      updatedAt: now,
    })
  }

  await addActivity(
    businessId,
    'patient_added',
    `${patient.firstName} ${patient.lastName} enrolled in ${patient.className}`
  )
  return patient
}

export async function updatePatient(id: string, data: PatientUpdateInput): Promise<Patient> {
  const businessId = requireBusinessId()
  const ref = doc(db, schoolPath(businessId, 'patients', id))
  const existing = await getDoc(ref)
  if (!existing.exists()) throw new Error('Not found')

  const current = { id, ...existing.data() } as Patient
  const now = new Date().toISOString()
  let className = current.className

  if (data.classId && data.classId !== current.classId) {
    const classes = await listCollection<Medicine>(businessId, 'medicines')
    const oldCls = classes.find((c) => c.id === current.classId)
    const newCls = classes.find((c) => c.id === data.classId)
    if (oldCls) {
      await updateDoc(doc(db, schoolPath(businessId, 'medicines', oldCls.id)), {
        patientIds: (oldCls.patientIds ?? []).filter((sid) => sid !== id),
        updatedAt: now,
      })
    }
    if (newCls) {
      await updateDoc(doc(db, schoolPath(businessId, 'medicines', newCls.id)), {
        patientIds: [...(newCls.patientIds ?? []), id],
        updatedAt: now,
      })
      className = newCls.name
    } else {
      className = getMedicineCategoryName(data.classId) ?? className
    }
  }

  const updated: Patient = {
    ...current,
    ...data,
    className,
    updatedAt: now,
  }
  await updateDoc(ref, asFirestoreUpdate(updated))
  return updated
}

export async function deletePatient(id: string): Promise<{ success: boolean }> {
  const businessId = requireBusinessId()
  const patient = await getPatient(id).catch(() => null)
  if (!patient) throw new Error('Not found')

  if (patient.classId) {
    const clsSnap = await getDoc(doc(db, schoolPath(businessId, 'medicines', patient.classId)))
    if (clsSnap.exists()) {
      const cls = clsSnap.data() as Medicine
      await updateDoc(clsSnap.ref, {
        patientIds: (cls.patientIds ?? []).filter((sid) => sid !== id),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  await deleteDoc(doc(db, schoolPath(businessId, 'patients', id)))
  return { success: true }
}

// ── Staffs ────────────────────────────────────────────────────────────────

export async function fetchStaffs(params?: {
  search?: string
  department?: string
  status?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Staff>> {
  const businessId = requireBusinessId()
  let result = await listCollection<Staff>(businessId, 'staff')

  if (params?.department) result = result.filter((t) => t.department === params.department)
  if (params?.status) result = result.filter((t) => t.status === params.status)
  result = filterBySearch(result, params?.search, [
    'firstName',
    'lastName',
    'employeeId',
    'email',
  ])

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

export const fetchStaff = async (id: string): Promise<Staff> => {
  const businessId = requireBusinessId()
  const snap = await getDoc(doc(db, schoolPath(businessId, 'staff', id)))
  if (!snap.exists()) throw new Error('Not found')
  return { id: snap.id, ...snap.data() } as Staff
}

export async function createStaff(data: StaffCreateInput): Promise<Staff> {
  const businessId = requireBusinessId()
  const id = generateId('tch')
  const now = new Date().toISOString()
  const teacher: Staff = { ...data, id, createdAt: now, updatedAt: now }
  await setDoc(doc(db, schoolPath(businessId, 'staff', id)), teacher)
  await addActivity(
    businessId,
    'staff_added',
    `${teacher.firstName} ${teacher.lastName} joined as ${teacher.department}`
  )
  return teacher
}

export async function updateStaff(id: string, data: StaffUpdateInput): Promise<Staff> {
  const businessId = requireBusinessId()
  const ref = doc(db, schoolPath(businessId, 'staff', id))
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Not found')
  const updated = {
    ...(snap.data() as Staff),
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  }
  await updateDoc(ref, asFirestoreUpdate(updated))
  return updated
}

export async function deleteStaff(id: string): Promise<{ success: boolean }> {
  const businessId = requireBusinessId()
  const ref = doc(db, schoolPath(businessId, 'staff', id))
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Not found')
  await updateDoc(ref, { status: 'archived', updatedAt: new Date().toISOString() })
  return { success: true }
}

// ── Classes ─────────────────────────────────────────────────────────────────

export async function fetchMedicines(params?: {
  search?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Medicine & { patientCount: number }>> {
  const businessId = requireBusinessId()
  let result = (await listCollection<Medicine>(businessId, 'medicines')).map((c) => ({
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
  const id = generateId('med')
  const now = new Date().toISOString()

  // Persist fields in Add Medicine section order (identity → potencies → symptoms → safety).
  const medicine: Medicine = {
    id,
    name: data.name,
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
  return updated
}

export async function deleteMedicine(id: string): Promise<{ success: boolean }> {
  const businessId = requireBusinessId()
  await deleteDoc(doc(db, schoolPath(businessId, 'medicines', id)))
  return { success: true }
}

// ── Attendance ──────────────────────────────────────────────────────────────

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

export async function fetchInventory(params?: Record<string, string>) {
  const businessId = requireBusinessId()
  let result = await listCollection<InventoryRecord>(businessId, 'inventory')
  if (params?.date) result = result.filter((r) => r.date === params.date)
  if (params?.classId) result = result.filter((r) => r.classId === params.classId)
  if (params?.patientId) result = result.filter((r) => r.patientId === params.patientId)
  if (params?.from) result = result.filter((r) => r.date >= params.from!)
  if (params?.to) result = result.filter((r) => r.date <= params.to!)
  return result
}

export async function fetchInventorySummary(params?: Record<string, string>) {
  const records = await fetchInventory(params)
  return buildInventorySummary(records)
}

export async function recordInventory(data: InventoryBulkInput): Promise<InventoryRecord[]> {
  const businessId = requireBusinessId()
  const classes = await listCollection<Medicine>(businessId, 'medicines')
  const patients = await listCollection<Patient>(businessId, 'patients')
  const cls = classes.find((c) => c.id === data.classId)
  const saved: InventoryRecord[] = []
  const now = new Date().toISOString()

  for (const rec of data.records) {
    const patient = patients.find((s) => s.id === rec.patientId)
    if (!patient) continue
    const id = generateId('att')
    const record: InventoryRecord = {
      id,
      date: data.date,
      classId: data.classId,
      className: cls?.name ?? '',
      patientId: rec.patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      rollNumber: patient.rollNumber,
      status: rec.status,
      recordedAt: now,
    }
    await setDoc(doc(db, schoolPath(businessId, 'inventory', id)), record)
    saved.push(record)
  }

  await addActivity(businessId, 'attendance_updated', `Attendance recorded for ${cls?.name ?? 'class'}`)
  return saved
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

export async function updatePrescription(id: string, data: PrescriptionUpdateInput): Promise<Prescription> {
  const businessId = requireBusinessId()
  const ref = doc(db, schoolPath(businessId, 'prescriptions', id))
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Not found')
  const updated: Prescription = {
    ...(snap.data() as Prescription),
    ...data,
    id,
  }
  await updateDoc(ref, asFirestoreUpdate(updated))
  return updated
}

export async function deletePrescription(id: string): Promise<{ success: boolean }> {
  const businessId = requireBusinessId()
  await deleteDoc(doc(db, schoolPath(businessId, 'prescriptions', id)))
  const results = await listCollection<PrescriptionItem>(businessId, 'prescriptionItems')
  await Promise.all(
    results
      .filter((r) => r.examId === id)
      .map((r) => deleteDoc(doc(db, schoolPath(businessId, 'prescriptionItems', r.id))))
  )
  return { success: true }
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

export async function fetchFeeStructures() {
  const businessId = requireBusinessId()
  return listCollection<import('@/types').FeeStructure>(businessId, 'feeStructures')
}

export async function fetchPatientFeeSummaries(overdueOnly?: boolean): Promise<PatientBillingSummary[]> {
  const businessId = requireBusinessId()
  const [patients, structures, payments] = await Promise.all([
    listCollection<Patient>(businessId, 'patients'),
    listCollection<import('@/types').FeeStructure>(businessId, 'feeStructures'),
    listCollection<Payment>(businessId, 'payments'),
  ])

  const summaries: PatientBillingSummary[] = patients.map((s) => {
    const due = structures.filter((f) => f.patientId === s.id).reduce((sum, f) => sum + f.amount, 0)
    const paid = payments.filter((p) => p.patientId === s.id).reduce((sum, p) => sum + p.amount, 0)
    const patientPayments = payments
      .filter((p) => p.patientId === s.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    const balance = due - paid
    return {
      patientId: s.id,
      patientName: `${s.firstName} ${s.lastName}`,
      rollNumber: s.rollNumber,
      className: s.className,
      totalDue: due,
      totalPaid: paid,
      balance,
      lastPaymentDate: patientPayments[0]?.date,
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

export async function getDashboardStats(): Promise<DashboardData> {
  const businessId = requireBusinessId()
  const [patients, teachers, classes, payments, attendance, activities] = await Promise.all([
    listCollection<Patient>(businessId, 'patients'),
    listCollection<Staff>(businessId, 'staff'),
    listCollection<Medicine>(businessId, 'medicines'),
    listCollection<Payment>(businessId, 'payments'),
    listCollection<InventoryRecord>(businessId, 'inventory'),
    listCollection<{ id: string; type: string; message: string; timestamp: string }>(
      businessId,
      'activities'
    ),
  ])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const feesThisMonth = payments
    .filter((p) => new Date(p.date) >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0)

  const today = now.toISOString().split('T')[0]
  const todayRecords = attendance.filter((r) => r.date === today)
  const attendanceRateToday =
    todayRecords.length > 0
      ? Math.round(
          (todayRecords.filter((r) => r.status === 'present').length / todayRecords.length) * 100
        )
      : 0

  const activePatients = patients.filter((s) => s.status === 'active')

  return {
    stats: {
      totalPatients: activePatients.length,
      totalStaffs: teachers.filter((t) => t.status === 'active').length,
      totalClasses: classes.length,
      feesCollectedThisMonth: feesThisMonth,
      attendanceRateToday,
    },
    enrollmentTrend: [
      { month: 'Jan', count: Math.max(0, activePatients.length - 5) },
      { month: 'Feb', count: Math.max(0, activePatients.length - 4) },
      { month: 'Mar', count: Math.max(0, activePatients.length - 3) },
      { month: 'Apr', count: Math.max(0, activePatients.length - 2) },
      { month: 'May', count: Math.max(0, activePatients.length - 1) },
      { month: 'Jun', count: activePatients.length },
    ],
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
  const businessId = requireBusinessId()
  const ref = doc(db, 'users', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Not found')
  const current = snap.data() as AdminUser
  if (current.businessId !== businessId) throw new Error('Forbidden')
  const updated = { ...current, ...data, id }
  await updateDoc(ref, asFirestoreUpdate(updated))
  return updated
}
