import type { AttendanceStatus, Patient, PatientDietItem, PatientEmergencyContacts, PatientPrescribedMedicine, PatientStatus } from '@/types'
import type { PatientVisitRecord } from '@/types/patient-visit'

export type PatientDetailTab = 'overview' | 'health' | 'prescriptions' | 'billing'

export interface PatientProfileHeader {
  id: string
  displayName: string
  initials: string
  firstName: string
  lastName: string
  rollNumber: string
  classId: string
  className: string
  year: number
  status: PatientStatus
  profileBadge: string
}

export interface PatientProfilePersonalInformation {
  sectionTitle: string
  sectionDescription: string
  firstName: string
  lastName: string
  rollNumber: string
  dateOfBirth: string
  email: string
  phone: string
  address: string
}

export interface PatientProfileGuardianSection {
  sectionTitle: string
  sectionDescription: string
  name: string
  relation: string
  phone: string
  email?: string
}

export interface PatientProfileNotesSection {
  sectionTitle: string
  sectionDescription: string
  content: string
  enrolledAt: string
  enrolledAtFormatted: string
  lastUpdatedAt: string
  lastUpdatedAtFormatted: string
}

export interface PatientProfileQuickContact {
  sectionTitle: string
  phone: string
  email: string
}

export interface PatientProfileResidence {
  sectionTitle: string
  address: string
}

export interface PatientProfileGuardianContact {
  sectionTitle: string
  phone: string
}

/** Extra enrollment fields from create form — updatable via PUT but not shown in tab cards. */
export interface PatientProfileExtendedRecord {
  aadharNumber?: string
  admissionDate?: string
  madrasaName?: string
  madrasaLocation?: string
  classSection?: string
  fees?: string
  schoolName?: string
  schoolLocation?: string
  schoolTiming?: string
  parents?: PatientEmergencyContacts
}

export interface PatientProfileOverviewTab {
  tabName: string
  tabId: 'overview'
  isEditable: boolean
  personalInformation: PatientProfilePersonalInformation
  guardian: PatientProfileGuardianSection
  notes: PatientProfileNotesSection
  quickContact: PatientProfileQuickContact
  residence: PatientProfileResidence
  guardianContact: PatientProfileGuardianContact
  extendedRecord?: PatientProfileExtendedRecord
}

export interface PatientProfileAcademicTab {
  tabName: string
  tabId: 'academic'
  isEditable: boolean
  summaryCards: {
    currentClass: { label: string; classId: string; className: string }
    academicYear: { label: string; year: number }
    enrollmentStatus: { label: string; status: PatientStatus }
  }
  academicRecord: {
    sectionTitle: string
    sectionDescription: string
    classSection: string
    classId: string
    rollNumber: string
    cohortYear: number
    status: PatientStatus
    classDetailsLink: string
    classDetailsLinkLabel: string
    enrolledAt: string
    enrolledAtFormatted: string
  }
}

export interface PatientProfileInventoryRecord {
  id: string
  date: string
  dateFormatted: string
  classId: string
  className: string
  patientId: string
  patientName: string
  rollNumber: string
  status: AttendanceStatus
  recordedAt: string
  recordedAtFormatted: string
}

export interface PatientProfileAttendanceTab {
  tabName: string
  tabId: 'inventory'
  isEditable: boolean
  summaryCards: {
    attendanceRate: { label: string; value: number; unit: string }
    present: { label: string; value: number }
    absent: { label: string; value: number }
    late: { label: string; value: number }
  }
  attendanceSummary: {
    patientId: string
    patientName: string
    rollNumber: string
    present: number
    absent: number
    late: number
    total: number
  } | null
  attendanceHistory: {
    sectionTitle: string
    sectionDescription: string
    records: PatientProfileInventoryRecord[]
    emptyMessage: string
  }
}

export interface PatientProfilePrescriptionMark {
  subject: string
  score: number
  maxScore: number
  display: string
}

export interface PatientProfilePrescriptionItem {
  id: string
  examId: string
  examTitle: string
  patientId: string
  patientName: string
  rollNumber: string
  classId: string
  total: number
  maxTotal: number
  percentage: number
  status: 'pass' | 'fail'
  marksSummary: string
  marks: PatientProfilePrescriptionMark[]
}

export interface PatientProfilePrescriptionsTab {
  tabName: string
  tabId: 'prescriptions'
  isEditable: boolean
  summaryCards: {
    examsTaken: { label: string; value: number }
    passed: { label: string; value: number }
    averageScore: { label: string; value: number; unit: string }
  }
  examResults: {
    sectionTitle: string
    sectionDescription: string
    results: PatientProfilePrescriptionItem[]
    emptyMessage: string
  }
}

export interface PatientProfileFeesTab {
  tabName: string
  tabId: 'billing'
  isEditable: boolean
  hasFeeRecords: boolean
  summaryCards: {
    totalDue: { label: string; value: number; currency: string; display: string }
    paid: { label: string; value: number; currency: string; display: string }
    balance: { label: string; value: number; currency: string; display: string }
    paymentStatus: { label: string; isOverdue: boolean; display: string }
  } | null
  paymentSummary: {
    sectionTitle: string
    patientId: string
    patientName: string
    rollNumber: string
    className: string
    totalDue: number
    totalPaid: number
    balance: number
    lastPaymentDate?: string
    lastPaymentDateFormatted?: string
    isOverdue: boolean
  } | null
  emptyMessage: string
}

export interface PatientProfileClinicalTab {
  tabName: string
  tabId: 'clinical'
  isEditable: boolean
  visitDate: string
  visitDateFormatted: string
  diseases: string[]
  diseaseLabels: string[]
  disease?: string
  prescription?: string
  prescribedMedicines: PatientPrescribedMedicine[]
  dietPlan: PatientDietItem[]
  additionalNotes?: string
  fees?: string
  feesFormatted: string
  visitHistory: PatientVisitRecord[]
  visitCount: number
}

/** GET /api/v1/patients/:id?profile=true and PUT response shape */
export interface PatientProfileData {
  header: PatientProfileHeader
  Overview: PatientProfileOverviewTab
  Academic: PatientProfileAcademicTab
  Attendance: PatientProfileAttendanceTab
  Prescriptions: PatientProfilePrescriptionsTab
  Fees: PatientProfileFeesTab
  Clinical: PatientProfileClinicalTab
}

export type PatientProfileUpdateBody =
  | PatientUpdateInputLike
  | { data: Partial<PatientProfileData> }
  | (Partial<PatientProfileData> & PatientUpdateInputLike)

type PatientUpdateInputLike = import('@/types').PatientUpdateInput

export function profileDetailToPatient(detail: PatientProfileData): Patient {
  const { header, Overview, Academic, Clinical } = detail
  const personal = Overview.personalInformation
  const guardian = Overview.guardian
  const extended = Overview.extendedRecord

  return {
    id: header.id,
    firstName: personal.firstName,
    lastName: personal.lastName,
    rollNumber: personal.rollNumber,
    email: personal.email,
    phone: personal.phone,
    classId: Academic.academicRecord.classId || header.classId,
    className: header.className,
    classSection: extended?.classSection,
    year: header.year,
    status: header.status,
    dateOfBirth: personal.dateOfBirth,
    aadharNumber: extended?.aadharNumber,
    admissionDate: Clinical?.visitDate ?? extended?.admissionDate,
    madrasaName: extended?.madrasaName,
    madrasaLocation: extended?.madrasaLocation,
    address: personal.address,
    schoolName: extended?.schoolName,
    schoolLocation: extended?.schoolLocation,
    schoolTiming: extended?.schoolTiming,
    fees: Clinical?.fees ?? extended?.fees,
    guardian: {
      name: guardian.name,
      phone: guardian.phone,
      relation: guardian.relation,
      email: guardian.email,
    },
    parents: extended?.parents,
    notes: Overview.notes.content || undefined,
    diseases: Clinical?.diseases ?? [],
    diseaseLabels: Clinical?.diseaseLabels ?? [],
    disease: Clinical?.disease,
    prescription: Clinical?.prescription,
    prescribedMedicines: Clinical?.prescribedMedicines ?? [],
    dietPlan: Clinical?.dietPlan ?? [],
    additionalNotes: Clinical?.additionalNotes,
    visitHistory: Clinical?.visitHistory ?? [],
    createdAt: Overview.notes.enrolledAt,
    updatedAt: Overview.notes.lastUpdatedAt,
  }
}
