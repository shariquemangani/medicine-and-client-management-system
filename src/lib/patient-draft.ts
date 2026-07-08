import type { Patient, PatientEmergencyContacts, PatientStatus, PatientUpdateInput } from '@/types'
import {
  resolveGuardianRelation,
  splitGuardianRelation,
} from '@/data/guardian-relations'
import {
  enrollmentDateToYear,
  joinPatientName,
  splitPatientName,
  patientAdmissionDate,
  type PatientFormValues,
} from '@/lib/patient-form-schema'

export interface PatientDraft {
  firstName: string
  lastName: string
  rollNumber: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  aadharNumber: string
  classId: string
  enrollmentDate: string
  status: PatientStatus
  madrasaName: string
  madrasaLocation: string
  classSection: string
  fees: string
  hasSchoolInfo: boolean
  schoolName: string
  schoolLocation: string
  schoolTiming: string
  guardianName: string
  guardianPhone: string
  guardianAadhar: string
  guardianRelation: string
  guardianRelationOther: string
  hasSecondaryGuardian: boolean
  secondaryGuardianName: string
  secondaryGuardianAadhar: string
  secondaryGuardianMobile: string
  secondaryGuardianRelation: string
  secondaryGuardianRelationOther: string
  notes: string
}

function hasSecondaryGuardianData(parents: Patient['parents']): boolean {
  if (!parents) return false
  return Boolean(
    parents.motherName?.trim() ||
      parents.motherAadhar?.trim() ||
      parents.motherMobile?.trim()
  )
}

export function patientToDraft(patient: Patient): PatientDraft {
  const relation = splitGuardianRelation(patient.guardian.relation)
  const parents = patient.parents
  const hasSecondary = hasSecondaryGuardianData(parents)
  const secondaryRelation = hasSecondary
    ? splitGuardianRelation(parents?.motherRelation ?? 'Mother')
    : { guardianRelation: '', guardianRelationOther: '' }

  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    rollNumber: patient.rollNumber,
    email: patient.email,
    phone: patient.phone,
    address: patient.address,
    dateOfBirth: patient.dateOfBirth,
    aadharNumber: patient.aadharNumber ?? '',
    classId: patient.classId,
    enrollmentDate: patientAdmissionDate(patient),
    status: patient.status,
    madrasaName: patient.madrasaName ?? '',
    madrasaLocation: patient.madrasaLocation ?? '',
    classSection: patient.classSection ?? '',
    fees: patient.fees ?? '',
    hasSchoolInfo: Boolean(
      patient.schoolName?.trim() || patient.schoolLocation?.trim() || patient.schoolTiming?.trim()
    ),
    schoolName: patient.schoolName ?? '',
    schoolLocation: patient.schoolLocation ?? '',
    schoolTiming: patient.schoolTiming ?? '',
    guardianName: parents?.fatherName ?? patient.guardian.name,
    guardianPhone: parents?.fatherMobile ?? patient.guardian.phone,
    guardianAadhar: parents?.fatherAadhar ?? '',
    guardianRelation: relation.guardianRelation,
    guardianRelationOther: relation.guardianRelationOther,
    hasSecondaryGuardian: hasSecondary,
    secondaryGuardianName: parents?.motherName ?? '',
    secondaryGuardianAadhar: parents?.motherAadhar ?? '',
    secondaryGuardianMobile: parents?.motherMobile ?? '',
    secondaryGuardianRelation: secondaryRelation.guardianRelation,
    secondaryGuardianRelationOther: secondaryRelation.guardianRelationOther,
    notes: patient.notes ?? '',
  }
}

export function draftToUpdatePayload(draft: PatientDraft): PatientUpdateInput {
  const guardianRelation = resolveGuardianRelation(draft.guardianRelation, draft.guardianRelationOther)
  const secondaryGuardianRelation = draft.hasSecondaryGuardian
    ? resolveGuardianRelation(draft.secondaryGuardianRelation, draft.secondaryGuardianRelationOther)
    : ''

  const parents: PatientEmergencyContacts = {
    fatherName: draft.guardianName.trim(),
    fatherAadhar: draft.guardianAadhar,
    fatherMobile: draft.guardianPhone,
    motherName: draft.hasSecondaryGuardian ? draft.secondaryGuardianName.trim() : '',
    motherAadhar: draft.hasSecondaryGuardian ? draft.secondaryGuardianAadhar : '',
    motherMobile: draft.hasSecondaryGuardian ? draft.secondaryGuardianMobile : '',
    ...(secondaryGuardianRelation ? { motherRelation: secondaryGuardianRelation } : {}),
  }

  const payload: PatientUpdateInput = {
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    rollNumber: draft.rollNumber.trim(),
    email: draft.email.trim(),
    phone: draft.phone,
    address: draft.address.trim(),
    dateOfBirth: draft.dateOfBirth,
    aadharNumber: draft.aadharNumber,
    classId: draft.classId,
    year: enrollmentDateToYear(draft.enrollmentDate),
    status: draft.status,
    admissionDate: draft.enrollmentDate,
    madrasaName: draft.madrasaName.trim(),
    fees: draft.fees.trim(),
    guardian: {
      name: draft.guardianName.trim(),
      phone: draft.guardianPhone,
      relation: guardianRelation,
    },
    parents,
    notes: draft.notes.trim(),
  }

  const madrasaLocation = draft.madrasaLocation.trim()
  if (madrasaLocation) payload.madrasaLocation = madrasaLocation

  const classSection = draft.classSection.trim()
  if (classSection) payload.classSection = classSection

  if (draft.hasSchoolInfo) {
    const schoolName = draft.schoolName.trim()
    const schoolLocation = draft.schoolLocation.trim()
    const schoolTiming = draft.schoolTiming.trim()
    if (schoolName) payload.schoolName = schoolName
    if (schoolLocation) payload.schoolLocation = schoolLocation
    if (schoolTiming) payload.schoolTiming = schoolTiming
  } else {
    payload.schoolName = ''
    payload.schoolLocation = ''
    payload.schoolTiming = ''
  }

  return payload
}

export function getDraftDisplayName(draft: PatientDraft) {
  return `${draft.firstName} ${draft.lastName}`.trim() || 'Patient'
}

/** Map detail-page draft to create-form values (shared section components). */
export function draftToFormValues(draft: PatientDraft): PatientFormValues {
  return {
    rollNumber: draft.rollNumber,
    patientName: joinPatientName({ firstName: draft.firstName, lastName: draft.lastName }),
    classSection: draft.classSection,
    dateOfBirth: draft.dateOfBirth,
    aadharNumber: draft.aadharNumber,
    patientPhone: draft.phone,
    admissionDate: draft.enrollmentDate,
    madrasaName: draft.madrasaName,
    madrasaLocation: draft.madrasaLocation,
    address: draft.address,
    guardianName: draft.guardianName,
    guardianAadhar: draft.guardianAadhar,
    guardianMobile: draft.guardianPhone,
    guardianRelation: draft.guardianRelation,
    guardianRelationOther: draft.guardianRelationOther,
    hasSecondaryGuardian: draft.hasSecondaryGuardian,
    secondaryGuardianName: draft.secondaryGuardianName,
    secondaryGuardianAadhar: draft.secondaryGuardianAadhar,
    secondaryGuardianMobile: draft.secondaryGuardianMobile,
    secondaryGuardianRelation: draft.secondaryGuardianRelation,
    secondaryGuardianRelationOther: draft.secondaryGuardianRelationOther,
    hasSchoolInfo: draft.hasSchoolInfo,
    schoolName: draft.schoolName,
    schoolLocation: draft.schoolLocation,
    standard: draft.classId,
    schoolTiming: draft.schoolTiming,
    fees: draft.fees,
    notes: draft.notes,
  }
}

/** Map create-form values back to detail draft (preserves system fields from base). */
export function formValuesToDraft(
  values: PatientFormValues,
  base: Pick<PatientDraft, 'email' | 'status'>
): PatientDraft {
  const { firstName, lastName } = splitPatientName(values.patientName)

  return {
    firstName,
    lastName,
    rollNumber: values.rollNumber,
    email: base.email,
    phone: values.patientPhone,
    address: values.address,
    dateOfBirth: values.dateOfBirth,
    aadharNumber: values.aadharNumber,
    classId: values.standard ?? '',
    enrollmentDate: values.admissionDate,
    status: base.status,
    madrasaName: values.madrasaName,
    madrasaLocation: values.madrasaLocation ?? '',
    classSection: values.classSection ?? '',
    fees: values.fees,
    hasSchoolInfo: values.hasSchoolInfo,
    schoolName: values.schoolName ?? '',
    schoolLocation: values.schoolLocation ?? '',
    schoolTiming: values.schoolTiming ?? '',
    guardianName: values.guardianName,
    guardianPhone: values.guardianMobile,
    guardianAadhar: values.guardianAadhar,
    guardianRelation: values.guardianRelation,
    guardianRelationOther: values.guardianRelationOther ?? '',
    hasSecondaryGuardian: values.hasSecondaryGuardian,
    secondaryGuardianName: values.secondaryGuardianName ?? '',
    secondaryGuardianAadhar: values.secondaryGuardianAadhar ?? '',
    secondaryGuardianMobile: values.secondaryGuardianMobile ?? '',
    secondaryGuardianRelation: values.secondaryGuardianRelation ?? '',
    secondaryGuardianRelationOther: values.secondaryGuardianRelationOther ?? '',
    notes: values.notes ?? '',
  }
}
