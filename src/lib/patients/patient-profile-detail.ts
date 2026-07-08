import { format } from 'date-fns'
import { getMedicineCategoryName } from '@/data/medicine-categories'
import { formatPhoneForDisplay } from '@/lib/phone-utils'
import { draftToUpdatePayload, type PatientDraft } from '@/lib/patient-draft'
import { patientAdmissionDate } from '@/lib/patient-form-schema'
import { formatAmount, parsePatientAmount } from '@/lib/patient-stats'
import type {
  InventoryRecord,
  InventorySummary,
  PrescriptionItem,
  Medicine,
  Patient,
  PatientBillingSummary,
  PatientUpdateInput,
} from '@/types'
import type {
  PatientProfileData,
  PatientProfileExtendedRecord,
  PatientProfileUpdateBody,
} from '@/types/patient-profile'

const PROFILE_BADGE = 'Patient Profile'
const FEE_CURRENCY = 'INR'

function safeFormatDate(iso: string | undefined, pattern: string, fallback = ''): string {
  if (!iso) return fallback
  const date = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return fallback
  return format(date, pattern)
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}`.toUpperCase() || 'ST'
}

function formatFeeAmount(amount: number): string {
  return formatAmount(amount)
}

function buildExtendedRecord(patient: Patient): PatientProfileExtendedRecord | undefined {
  const extended: PatientProfileExtendedRecord = {}
  if (patient.aadharNumber) extended.aadharNumber = patient.aadharNumber
  if (patient.admissionDate) extended.admissionDate = patient.admissionDate
  if (patient.madrasaName) extended.madrasaName = patient.madrasaName
  if (patient.madrasaLocation) extended.madrasaLocation = patient.madrasaLocation
  if (patient.classSection) extended.classSection = patient.classSection
  if (patient.fees) extended.fees = patient.fees
  if (patient.schoolName) extended.schoolName = patient.schoolName
  if (patient.schoolLocation) extended.schoolLocation = patient.schoolLocation
  if (patient.schoolTiming) extended.schoolTiming = patient.schoolTiming
  if (patient.parents) extended.parents = patient.parents
  return Object.keys(extended).length > 0 ? extended : undefined
}

export interface BuildPatientProfileDetailInput {
  patient: Patient
  attendance: InventoryRecord[]
  attendanceSummary: InventorySummary | null
  feeSummary: PatientBillingSummary | null
  examResults: PrescriptionItem[]
}

export function buildPatientProfileDetail(input: BuildPatientProfileDetailInput): PatientProfileData {
  const { patient, attendance, attendanceSummary, feeSummary, examResults } = input
  const displayName = `${patient.firstName} ${patient.lastName}`.trim()
  const enrolledAt = patient.createdAt
  const admissionDate = patientAdmissionDate(patient)
  const attendanceRate =
    attendanceSummary && attendanceSummary.total > 0
      ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
      : 0
  const passedPrescriptions = examResults.filter((r) => r.status === 'pass').length
  const averageScore =
    examResults.length > 0
      ? Math.round(examResults.reduce((sum, r) => sum + r.percentage, 0) / examResults.length)
      : 0

  const attendanceRecords = [...attendance]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
    .map((record) => ({
      id: record.id,
      date: record.date,
      dateFormatted: safeFormatDate(record.date, 'MMM d, yyyy'),
      classId: record.classId,
      className: record.className,
      patientId: record.patientId,
      patientName: record.patientName,
      rollNumber: record.rollNumber,
      status: record.status,
      recordedAt: record.recordedAt,
      recordedAtFormatted: safeFormatDate(record.recordedAt, 'MMM d, yyyy'),
    }))

  const examResultItems = examResults.map((result) => ({
    id: result.id,
    examId: result.examId,
    examTitle: `Prescription #${result.examId}`,
    patientId: result.patientId,
    patientName: result.patientName,
    rollNumber: result.rollNumber,
    classId: result.classId,
    total: result.total,
    maxTotal: result.maxTotal,
    percentage: result.percentage,
    status: result.status,
    marksSummary: `${result.total}/${result.maxTotal} marks · ${result.percentage}%`,
    marks: result.marks.map((mark) => ({
      subject: mark.subject,
      score: mark.score,
      maxScore: mark.maxScore,
      display: `${mark.subject}: ${mark.score}/${mark.maxScore}`,
    })),
  }))

  const hasFeeRecords = Boolean(feeSummary && (feeSummary.totalDue > 0 || feeSummary.totalPaid > 0))
  const visitDate = patient.admissionDate?.trim() || patient.dateOfBirth?.trim() || admissionDate
  const visitHistory = [...(patient.visitHistory ?? [])].sort((a, b) =>
    b.visitDate.localeCompare(a.visitDate)
  )

  return {
    header: {
      id: patient.id,
      displayName,
      initials: getInitials(patient.firstName, patient.lastName),
      firstName: patient.firstName,
      lastName: patient.lastName,
      rollNumber: patient.rollNumber,
      classId: patient.classId,
      className: patient.className,
      year: patient.year,
      status: patient.status,
      profileBadge: PROFILE_BADGE,
    },
    Overview: {
      tabName: 'Overview',
      tabId: 'overview',
      isEditable: true,
      personalInformation: {
        sectionTitle: 'Personal Information',
        sectionDescription: 'Core identity and contact details',
        firstName: patient.firstName,
        lastName: patient.lastName,
        rollNumber: patient.rollNumber,
        dateOfBirth: patient.dateOfBirth,
        email: patient.email,
        phone: formatPhoneForDisplay(patient.phone) || patient.phone,
        address: patient.address,
      },
      guardian: {
        sectionTitle: 'Guardian',
        sectionDescription: 'Primary emergency contact',
        name: patient.guardian.name,
        relation: patient.guardian.relation,
        phone: formatPhoneForDisplay(patient.guardian.phone) || patient.guardian.phone,
        email: patient.guardian.email,
      },
      notes: {
        sectionTitle: 'Notes',
        sectionDescription: 'Administrative remarks',
        content: patient.notes?.trim() ?? '',
        enrolledAt,
        enrolledAtFormatted: safeFormatDate(enrolledAt, 'MMM d, yyyy'),
        lastUpdatedAt: patient.updatedAt,
        lastUpdatedAtFormatted: safeFormatDate(patient.updatedAt, 'MMM d, yyyy'),
      },
      quickContact: {
        sectionTitle: 'Quick contact',
        phone: formatPhoneForDisplay(patient.phone) || patient.phone,
        email: patient.email,
      },
      residence: {
        sectionTitle: 'Residence',
        address: patient.address,
      },
      guardianContact: {
        sectionTitle: 'Guardian contact',
        phone: formatPhoneForDisplay(patient.guardian.phone) || patient.guardian.phone,
      },
      extendedRecord: buildExtendedRecord(patient),
    },
    Academic: {
      tabName: 'Academic',
      tabId: 'academic',
      isEditable: true,
      summaryCards: {
        currentClass: {
          label: 'Current class',
          classId: patient.classId,
          className: patient.className,
        },
        academicYear: {
          label: 'Academic year',
          year: patient.year,
        },
        enrollmentStatus: {
          label: 'Enrollment status',
          status: patient.status,
        },
      },
      academicRecord: {
        sectionTitle: 'Academic record',
        sectionDescription: 'Class placement and enrollment timeline',
        classSection: patient.classSection ?? patient.className,
        classId: patient.classId,
        rollNumber: patient.rollNumber,
        cohortYear: patient.year,
        status: patient.status,
        classDetailsLink: `/classes/${patient.classId}`,
        classDetailsLinkLabel: 'View class details',
        enrolledAt: admissionDate.includes('T') ? admissionDate : `${admissionDate}T00:00:00.000Z`,
        enrolledAtFormatted: safeFormatDate(admissionDate, 'MMMM d, yyyy'),
      },
    },
    Attendance: {
      tabName: 'Attendance',
      tabId: 'inventory',
      isEditable: false,
      summaryCards: {
        attendanceRate: { label: 'Attendance rate', value: attendanceRate, unit: '%' },
        present: { label: 'Present', value: attendanceSummary?.present ?? 0 },
        absent: { label: 'Absent', value: attendanceSummary?.absent ?? 0 },
        late: { label: 'Late', value: attendanceSummary?.late ?? 0 },
      },
      attendanceSummary: attendanceSummary
        ? {
            patientId: attendanceSummary.patientId,
            patientName: attendanceSummary.patientName,
            rollNumber: attendanceSummary.rollNumber,
            present: attendanceSummary.present,
            absent: attendanceSummary.absent,
            late: attendanceSummary.late,
            total: attendanceSummary.total,
          }
        : null,
      attendanceHistory: {
        sectionTitle: 'Attendance history',
        sectionDescription: 'Recent recorded sessions',
        records: attendanceRecords,
        emptyMessage: 'No attendance records yet for this patient.',
      },
    },
    Prescriptions: {
      tabName: 'Prescriptions',
      tabId: 'prescriptions',
      isEditable: false,
      summaryCards: {
        examsTaken: { label: 'Prescriptions taken', value: examResults.length },
        passed: { label: 'Passed', value: passedPrescriptions },
        averageScore: { label: 'Average score', value: averageScore, unit: '%' },
      },
      examResults: {
        sectionTitle: 'Prescription results',
        sectionDescription: 'Performance across assessments',
        results: examResultItems,
        emptyMessage: 'No exam results recorded yet.',
      },
    },
    Fees: {
      tabName: 'Fees',
      tabId: 'billing',
      isEditable: false,
      hasFeeRecords,
      summaryCards: feeSummary
        ? {
            totalDue: {
              label: 'Total due',
              value: feeSummary.totalDue,
              currency: FEE_CURRENCY,
              display: formatFeeAmount(feeSummary.totalDue),
            },
            paid: {
              label: 'Paid',
              value: feeSummary.totalPaid,
              currency: FEE_CURRENCY,
              display: formatFeeAmount(feeSummary.totalPaid),
            },
            balance: {
              label: 'Balance',
              value: feeSummary.balance,
              currency: FEE_CURRENCY,
              display: formatFeeAmount(feeSummary.balance),
            },
            paymentStatus: {
              label: 'Status',
              isOverdue: feeSummary.isOverdue,
              display: feeSummary.isOverdue ? 'Overdue' : 'On track',
            },
          }
        : null,
      paymentSummary: feeSummary
        ? {
            sectionTitle: 'Payment summary',
            patientId: feeSummary.patientId,
            patientName: feeSummary.patientName,
            rollNumber: feeSummary.rollNumber,
            className: feeSummary.className,
            totalDue: feeSummary.totalDue,
            totalPaid: feeSummary.totalPaid,
            balance: feeSummary.balance,
            lastPaymentDate: feeSummary.lastPaymentDate
              ? `${feeSummary.lastPaymentDate}T00:00:00.000Z`
              : undefined,
            lastPaymentDateFormatted: feeSummary.lastPaymentDate
              ? safeFormatDate(feeSummary.lastPaymentDate, 'MMM d, yyyy')
              : undefined,
            isOverdue: feeSummary.isOverdue,
          }
        : null,
      emptyMessage: 'No fee records found for this patient.',
    },
    Clinical: {
      tabName: 'Clinical',
      tabId: 'clinical',
      isEditable: true,
      visitDate,
      visitDateFormatted: safeFormatDate(visitDate, 'MMMM d, yyyy'),
      diseases: patient.diseases ?? [],
      diseaseLabels: patient.diseaseLabels ?? [],
      disease: patient.disease,
      prescription: patient.prescription,
      prescribedMedicines: patient.prescribedMedicines ?? [],
      dietPlan: patient.dietPlan ?? [],
      additionalNotes: patient.additionalNotes,
      fees: patient.fees,
      feesFormatted: formatFeeAmount(parsePatientAmount(patient.fees)),
      visitHistory,
      visitCount: visitHistory.length,
    },
  }
}

function isProfileDetailPayload(value: unknown): value is Partial<PatientProfileData> {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Boolean(record.header || record.Overview || record.Academic)
}

function extractFromProfileDetail(detail: Partial<PatientProfileData>): PatientUpdateInput {
  const update: PatientUpdateInput = {}
  const header = detail.header
  const overview = detail.Overview
  const academic = detail.Academic
  const personal = overview?.personalInformation
  const guardian = overview?.guardian
  const notes = overview?.notes
  const extended = overview?.extendedRecord
  const record = academic?.academicRecord
  const summary = academic?.summaryCards

  if (header) {
    if (header.firstName !== undefined) update.firstName = header.firstName
    if (header.lastName !== undefined) update.lastName = header.lastName
    if (header.rollNumber !== undefined) update.rollNumber = header.rollNumber
    if (header.classId !== undefined) update.classId = header.classId
    if (header.year != null) update.year = header.year
    if (header.status !== undefined) update.status = header.status
  }

  if (personal) {
    if (personal.firstName !== undefined) update.firstName = personal.firstName
    if (personal.lastName !== undefined) update.lastName = personal.lastName
    if (personal.rollNumber !== undefined) update.rollNumber = personal.rollNumber
    if (personal.dateOfBirth !== undefined) update.dateOfBirth = personal.dateOfBirth
    if (personal.email !== undefined) update.email = personal.email
    if (personal.phone !== undefined) update.phone = personal.phone
    if (personal.address !== undefined) update.address = personal.address
  }

  if (guardian) {
    update.guardian = {
      name: guardian.name ?? '',
      phone: guardian.phone ?? '',
      relation: guardian.relation ?? '',
      ...(guardian.email ? { email: guardian.email } : {}),
    }
  }

  if (notes && 'content' in notes) update.notes = notes.content

  if (record) {
    if (record.classId !== undefined) update.classId = record.classId
    if (record.rollNumber !== undefined) update.rollNumber = record.rollNumber
    if (record.cohortYear != null) update.year = record.cohortYear
    if (record.status !== undefined) update.status = record.status
    if (record.enrolledAt) update.admissionDate = record.enrolledAt.slice(0, 10)
    if (record.classSection !== undefined) update.classSection = record.classSection
  }

  if (summary?.academicYear?.year != null) update.year = summary.academicYear.year
  if (summary?.enrollmentStatus?.status !== undefined) update.status = summary.enrollmentStatus.status
  if (summary?.currentClass?.classId !== undefined) update.classId = summary.currentClass.classId

  if (extended) {
    if ('aadharNumber' in extended) update.aadharNumber = extended.aadharNumber
    if ('admissionDate' in extended) update.admissionDate = extended.admissionDate
    if ('madrasaName' in extended) update.madrasaName = extended.madrasaName
    if ('madrasaLocation' in extended) update.madrasaLocation = extended.madrasaLocation
    if ('classSection' in extended) update.classSection = extended.classSection
    if ('billing' in extended) update.fees = extended.fees
    if ('schoolName' in extended) update.schoolName = extended.schoolName ?? ''
    if ('schoolLocation' in extended) update.schoolLocation = extended.schoolLocation ?? ''
    if ('schoolTiming' in extended) update.schoolTiming = extended.schoolTiming ?? ''
    if ('parents' in extended && extended.parents) update.parents = extended.parents
  }

  return update
}

function buildExtendedRecordFromUpdate(update: PatientUpdateInput): PatientProfileExtendedRecord {
  const extended: PatientProfileExtendedRecord = {}

  if (update.aadharNumber !== undefined) extended.aadharNumber = update.aadharNumber
  if (update.admissionDate !== undefined) extended.admissionDate = update.admissionDate
  if (update.madrasaName !== undefined) extended.madrasaName = update.madrasaName
  if (update.madrasaLocation !== undefined) extended.madrasaLocation = update.madrasaLocation
  if (update.classSection !== undefined) extended.classSection = update.classSection
  if (update.fees !== undefined) extended.fees = update.fees
  if (update.schoolName !== undefined) extended.schoolName = update.schoolName
  if (update.schoolLocation !== undefined) extended.schoolLocation = update.schoolLocation
  if (update.schoolTiming !== undefined) extended.schoolTiming = update.schoolTiming
  if (update.parents) extended.parents = update.parents

  return extended
}

function resolveClassName(classes: Medicine[], classId: string, fallback: string): string {
  return classes.find((item) => item.id === classId)?.name ?? getMedicineCategoryName(classId) ?? fallback
}

/** Merge edit draft into the GET profile shape for PUT `{ data: … }` requests. */
export function applyDraftToPatientProfile(
  draft: PatientDraft,
  profile: PatientProfileData,
  classes: Medicine[] = []
): PatientProfileData {
  const update = draftToUpdatePayload(draft)
  const className = resolveClassName(classes, draft.classId, profile.header.className)
  const displayName = `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim()
  const year = update.year ?? profile.header.year
  const admissionDate = update.admissionDate ?? draft.enrollmentDate
  const enrolledAtIso = admissionDate.includes('T')
    ? admissionDate
    : `${admissionDate}T00:00:00.000Z`
  const classSection = update.classSection ?? (draft.classSection.trim() || className)
  const email = update.email ?? (draft.email.trim() || profile.Overview.personalInformation.email)
  const guardian = update.guardian ?? {
    name: draft.guardianName.trim(),
    phone: draft.guardianPhone,
    relation: profile.Overview.guardian.relation,
  }
  const extendedRecord = buildExtendedRecordFromUpdate(update)
  const guardianPhone = guardian.phone

  return {
    ...profile,
    header: {
      ...profile.header,
      displayName,
      initials: getInitials(draft.firstName, draft.lastName),
      firstName: update.firstName ?? draft.firstName.trim(),
      lastName: update.lastName ?? draft.lastName.trim(),
      rollNumber: update.rollNumber ?? draft.rollNumber.trim(),
      classId: update.classId ?? draft.classId,
      className,
      year,
      status: update.status ?? draft.status,
    },
    Overview: {
      ...profile.Overview,
      personalInformation: {
        ...profile.Overview.personalInformation,
        firstName: update.firstName ?? draft.firstName.trim(),
        lastName: update.lastName ?? draft.lastName.trim(),
        rollNumber: update.rollNumber ?? draft.rollNumber.trim(),
        dateOfBirth: update.dateOfBirth ?? draft.dateOfBirth,
        email,
        phone: draft.phone,
        address: update.address ?? draft.address.trim(),
      },
      guardian: {
        ...profile.Overview.guardian,
        name: guardian.name,
        relation: guardian.relation,
        phone: guardianPhone,
        ...(guardian.email ? { email: guardian.email } : {}),
      },
      notes: {
        ...profile.Overview.notes,
        content: update.notes ?? draft.notes.trim(),
      },
      quickContact: {
        ...profile.Overview.quickContact,
        phone: draft.phone,
        email,
      },
      residence: {
        ...profile.Overview.residence,
        address: update.address ?? draft.address.trim(),
      },
      guardianContact: {
        ...profile.Overview.guardianContact,
        phone: guardianPhone,
      },
      extendedRecord,
    },
    Academic: {
      ...profile.Academic,
      summaryCards: {
        currentClass: {
          label: profile.Academic.summaryCards.currentClass.label,
          classId: update.classId ?? draft.classId,
          className,
        },
        academicYear: {
          label: profile.Academic.summaryCards.academicYear.label,
          year,
        },
        enrollmentStatus: {
          label: profile.Academic.summaryCards.enrollmentStatus.label,
          status: update.status ?? draft.status,
        },
      },
      academicRecord: {
        ...profile.Academic.academicRecord,
        classSection,
        classId: update.classId ?? draft.classId,
        rollNumber: update.rollNumber ?? draft.rollNumber.trim(),
        cohortYear: year,
        status: update.status ?? draft.status,
        classDetailsLink: `/classes/${update.classId ?? draft.classId}`,
        enrolledAt: enrolledAtIso,
        enrolledAtFormatted: safeFormatDate(admissionDate, 'MMMM d, yyyy'),
      },
    },
  }
}

/** PUT body wrapper — same `{ data: profile }` envelope as GET. */
export function draftToProfileUpdateBody(
  draft: PatientDraft,
  profile: PatientProfileData,
  classes: Medicine[] = []
): { data: PatientProfileData } {
  return {
    data: applyDraftToPatientProfile(draft, profile, classes),
  }
}

/** Accepts flat PatientUpdateInput, nested `{ data: profile }`, or profile tabs at root. */
export function parsePatientUpdateBody(body: PatientProfileUpdateBody): PatientUpdateInput {
  if (!body || typeof body !== 'object') return {}

  const record = body as Record<string, unknown>
  let update: PatientUpdateInput = {}

  if (record.data && typeof record.data === 'object') {
    update = { ...update, ...extractFromProfileDetail(record.data as Partial<PatientProfileData>) }
  }

  if (isProfileDetailPayload(body)) {
    update = { ...update, ...extractFromProfileDetail(body as Partial<PatientProfileData>) }
  }

  const {
    data: _data,
    header: _header,
    Overview: _overview,
    Academic: _academic,
    Attendance: _attendance,
    Prescriptions: _exams,
    Fees: _fees,
    ...flatFields
  } = record

  if (Object.keys(flatFields).length > 0) {
    update = { ...update, ...(flatFields as PatientUpdateInput) }
  }

  return update
}
