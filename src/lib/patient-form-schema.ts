import { z } from 'zod'
import type { Patient, PatientCreateInput, PatientEmergencyContacts } from '@/types'
import { DEFAULT_MEDICINE_CATEGORIES } from '@/data/medicine-categories'
import {
  DEFAULT_ENROLLMENT_YEAR,
  MAX_ENROLLMENT_YEAR,
  MIN_ENROLLMENT_YEAR,
} from '@/data/enrollment-years'
import {
  GUARDIAN_RELATION_OTHER,
  resolveGuardianRelation,
  splitGuardianRelation,
} from '@/data/guardian-relations'
import { parseIsoDateParts, todayIsoDate } from '@/lib/date-select-utils'
import { isValidMobileNumber, parsePhoneValue } from '@/lib/phone-utils'

const MIN_PATIENT_AGE_YEARS = 4
const MAX_PATIENT_AGE_YEARS = 100

export const MAX_PATIENT_NAME_LENGTH = 60
export const MAX_MADRASA_NAME_LENGTH = 70
export const MAX_SCHOOL_NAME_LENGTH = 70

const aadharSchema = z
  .string()
  .min(1, 'Required')
  .refine((value) => /^\d{12}$/.test(value), 'Must be 12 digits')

const optionalAadharSchema = z
  .string()
  .refine((value) => !value || /^\d{12}$/.test(value), 'Must be 12 digits')

const mobileSchema = z
  .string()
  .min(1, 'Required')
  .refine((value) => {
    const { countryCode, number } = parsePhoneValue(value)
    return isValidMobileNumber(countryCode, number)
  }, 'Enter a valid 10-digit mobile number')

const optionalMobileSchema = z
  .string()
  .refine((value) => {
    if (!value.trim()) return true
    const { countryCode, number } = parsePhoneValue(value)
    return isValidMobileNumber(countryCode, number)
  }, 'Enter a valid 10-digit mobile number')

export function getPatientDobMinDate(): Date {
  return new Date(new Date().getFullYear() - MAX_PATIENT_AGE_YEARS, 0, 1)
}

export function enrollmentDateToYear(date: string): number {
  const parsed = parseIsoDateParts(date)
  return parsed?.year ?? DEFAULT_ENROLLMENT_YEAR
}

export function patientAdmissionDate(patient: Patient): string {
  if (patient.admissionDate && /^\d{4}-\d{2}-\d{2}$/.test(patient.admissionDate)) {
    return patient.admissionDate
  }
  const fromCreated = patient.createdAt?.slice(0, 10)
  if (fromCreated && /^\d{4}-\d{2}-\d{2}$/.test(fromCreated)) return fromCreated
  return `${patient.year}-01-01`
}

/** @deprecated Use patientAdmissionDate — kept for detail/edit tabs */
export function patientEnrollmentDate(patient: Patient): string {
  return patientAdmissionDate(patient)
}

export function getPatientDobMaxDate(): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_PATIENT_AGE_YEARS)
  d.setHours(23, 59, 59, 999)
  return d
}

function parseDobString(value: string): Date | undefined {
  const [y, m, day] = value.split('-').map(Number)
  if (!y || !m || !day) return undefined
  const date = new Date(y, m - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function splitPatientName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim()
  const space = trimmed.indexOf(' ')
  if (space === -1) return { firstName: trimmed, lastName: '-' }
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim() || '-',
  }
}

export function joinPatientName(patient: Pick<Patient, 'firstName' | 'lastName'>): string {
  return `${patient.firstName} ${patient.lastName}`.replace(/\s-/g, '').trim()
}

function hasSecondaryGuardianData(parents: Patient['parents']): boolean {
  if (!parents) return false
  return Boolean(
    parents.motherName?.trim() ||
      parents.motherAadhar?.trim() ||
      parents.motherMobile?.trim()
  )
}

export const patientFormSchema = z
  .object({
    rollNumber: z.string().min(1, 'Required'),
    patientName: z.string().min(1, 'Required').max(MAX_PATIENT_NAME_LENGTH),
    classSection: z.string().optional(),
    dateOfBirth: z
      .string()
      .min(1, 'Required')
      .refine((value) => {
        const date = parseDobString(value)
        if (!date) return false
        return date >= getPatientDobMinDate() && date <= getPatientDobMaxDate()
      }, `Patient must be at least ${MIN_PATIENT_AGE_YEARS} years old`),
    aadharNumber: aadharSchema,
    patientPhone: mobileSchema,
    admissionDate: z
      .string()
      .min(1, 'Required')
      .refine((value) => {
        const parsed = parseIsoDateParts(value)
        if (!parsed) return false
        return parsed.year >= MIN_ENROLLMENT_YEAR && parsed.year <= MAX_ENROLLMENT_YEAR
      }, 'Invalid admission date'),
    madrasaName: z.string().min(1, 'Required').max(MAX_MADRASA_NAME_LENGTH),
    madrasaLocation: z.string().optional(),
    address: z.string().min(1, 'Required'),
    guardianName: z.string().min(1, 'Required'),
    guardianAadhar: aadharSchema,
    guardianMobile: mobileSchema,
    guardianRelation: z.string().min(1, 'Required'),
    guardianRelationOther: z.string().optional(),
    hasSecondaryGuardian: z.boolean(),
    secondaryGuardianName: z.string().optional(),
    secondaryGuardianAadhar: optionalAadharSchema.optional(),
    secondaryGuardianMobile: optionalMobileSchema.optional(),
    secondaryGuardianRelation: z.string().optional(),
    secondaryGuardianRelationOther: z.string().optional(),
    hasSchoolInfo: z.boolean(),
    schoolName: z.string().max(MAX_SCHOOL_NAME_LENGTH).optional(),
    schoolLocation: z.string().optional(),
    standard: z.string().optional(),
    schoolTiming: z.string().optional(),
    fees: z.string().min(1, 'Required'),
    notes: z.string().max(500),
  })
  .superRefine((data, ctx) => {
    if (data.hasSchoolInfo) {
      if (!data.schoolName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Required',
          path: ['schoolName'],
        })
      }
      if (!data.standard?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Required',
          path: ['standard'],
        })
      }
      if (!data.schoolTiming?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Required',
          path: ['schoolTiming'],
        })
      }
    }

    if (data.guardianRelation === GUARDIAN_RELATION_OTHER && !data.guardianRelationOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['guardianRelationOther'],
      })
    }

    if (!data.hasSecondaryGuardian) return

    if (!data.secondaryGuardianName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['secondaryGuardianName'],
      })
    }
    if (!data.secondaryGuardianAadhar || !/^\d{12}$/.test(data.secondaryGuardianAadhar)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['secondaryGuardianAadhar'],
      })
    }
    if (!data.secondaryGuardianMobile?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['secondaryGuardianMobile'],
      })
    } else {
      const { countryCode, number } = parsePhoneValue(data.secondaryGuardianMobile)
      if (!isValidMobileNumber(countryCode, number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid 10-digit mobile number',
          path: ['secondaryGuardianMobile'],
        })
      }
    }
    if (!data.secondaryGuardianRelation?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['secondaryGuardianRelation'],
      })
    }
    if (
      data.secondaryGuardianRelation === GUARDIAN_RELATION_OTHER &&
      !data.secondaryGuardianRelationOther?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['secondaryGuardianRelationOther'],
      })
    }
  })

export type PatientFormValues = z.infer<typeof patientFormSchema>

export function getPatientFormDefaults(
  editing: Patient | null,
  classOptions: { id: string }[] = DEFAULT_MEDICINE_CATEGORIES
): PatientFormValues {
  if (editing) {
    const parents = editing.parents
    const relation = splitGuardianRelation(editing.guardian.relation)
    const hasSecondary = hasSecondaryGuardianData(parents)
    const secondaryRelation = hasSecondary
      ? splitGuardianRelation(parents?.motherRelation ?? 'Mother')
      : { guardianRelation: '', guardianRelationOther: '' }

    return {
      rollNumber: editing.rollNumber,
      patientName: joinPatientName(editing),
      classSection: editing.classSection ?? '',
      dateOfBirth: editing.dateOfBirth,
      aadharNumber: editing.aadharNumber ?? '',
      patientPhone: editing.phone,
      admissionDate: patientAdmissionDate(editing),
      madrasaName: editing.madrasaName ?? '',
      madrasaLocation: editing.madrasaLocation ?? '',
      address: editing.address,
      guardianName: parents?.fatherName ?? editing.guardian.name,
      guardianAadhar: parents?.fatherAadhar ?? '',
      guardianMobile: parents?.fatherMobile ?? editing.guardian.phone,
      guardianRelation: relation.guardianRelation,
      guardianRelationOther: relation.guardianRelationOther,
      hasSecondaryGuardian: hasSecondary,
      secondaryGuardianName: parents?.motherName ?? '',
      secondaryGuardianAadhar: parents?.motherAadhar ?? '',
      secondaryGuardianMobile: parents?.motherMobile ?? '',
      secondaryGuardianRelation: secondaryRelation.guardianRelation,
      secondaryGuardianRelationOther: secondaryRelation.guardianRelationOther,
      hasSchoolInfo: Boolean(
        editing.schoolName?.trim() || editing.schoolLocation?.trim() || editing.schoolTiming?.trim()
      ),
      schoolName: editing.schoolName ?? '',
      schoolLocation: editing.schoolLocation ?? '',
      standard: editing.classId,
      schoolTiming: editing.schoolTiming ?? '',
      fees: editing.fees ?? '',
      notes: editing.notes ?? '',
    }
  }

  return {
    rollNumber: '',
    patientName: '',
    classSection: '',
    dateOfBirth: '',
    aadharNumber: '',
    patientPhone: '',
    admissionDate: todayIsoDate(),
    madrasaName: '',
    madrasaLocation: '',
    address: '',
    guardianName: '',
    guardianAadhar: '',
    guardianMobile: '',
    guardianRelation: 'Parent',
    guardianRelationOther: '',
    hasSecondaryGuardian: false,
    secondaryGuardianName: '',
    secondaryGuardianAadhar: '',
    secondaryGuardianMobile: '',
    secondaryGuardianRelation: '',
    secondaryGuardianRelationOther: '',
    hasSchoolInfo: true,
    schoolName: '',
    schoolLocation: '',
    standard: classOptions[0]?.id ?? DEFAULT_MEDICINE_CATEGORIES[0].id,
    schoolTiming: '',
    fees: '',
    notes: '',
  }
}

export function patientFormValuesToPayload(values: PatientFormValues): PatientCreateInput {
  const { firstName, lastName } = splitPatientName(values.patientName)
  const guardianRelation = resolveGuardianRelation(
    values.guardianRelation,
    values.guardianRelationOther
  )
  const secondaryGuardianRelation = values.hasSecondaryGuardian
    ? resolveGuardianRelation(
        values.secondaryGuardianRelation ?? '',
        values.secondaryGuardianRelationOther
      )
    : ''
  const defaultClassId = DEFAULT_MEDICINE_CATEGORIES[0]?.id ?? 'std_01'

  const parents: PatientEmergencyContacts = {
    fatherName: values.guardianName.trim(),
    fatherAadhar: values.guardianAadhar,
    fatherMobile: values.guardianMobile,
    motherName: values.hasSecondaryGuardian ? (values.secondaryGuardianName?.trim() ?? '') : '',
    motherAadhar: values.hasSecondaryGuardian ? (values.secondaryGuardianAadhar ?? '') : '',
    motherMobile: values.hasSecondaryGuardian ? (values.secondaryGuardianMobile ?? '') : '',
    ...(secondaryGuardianRelation ? { motherRelation: secondaryGuardianRelation } : {}),
  }

  const payload: PatientCreateInput = {
    // Patient information
    firstName,
    lastName,
    rollNumber: values.rollNumber.trim(),
    email: `${values.rollNumber.trim()}@patient.local`,
    phone: values.patientPhone,
    dateOfBirth: values.dateOfBirth,
    aadharNumber: values.aadharNumber,
    address: values.address.trim(),

    // Madrasa
    admissionDate: values.admissionDate,
    madrasaName: values.madrasaName.trim(),
    year: enrollmentDateToYear(values.admissionDate),
    fees: values.fees.trim(),

    // School & academic (classId always set; school fields only when section enabled)
    classId: values.hasSchoolInfo ? (values.standard?.trim() || defaultClassId) : defaultClassId,

    // Guardian information
    guardian: {
      name: values.guardianName.trim(),
      phone: values.guardianMobile,
      relation: guardianRelation,
    },
    parents,

    status: 'active',
  }

  const madrasaLocation = values.madrasaLocation?.trim()
  if (madrasaLocation) payload.madrasaLocation = madrasaLocation

  const classSection = values.classSection?.trim()
  if (classSection) payload.classSection = classSection

  if (values.hasSchoolInfo) {
    const schoolName = values.schoolName?.trim()
    const schoolLocation = values.schoolLocation?.trim()
    const schoolTiming = values.schoolTiming?.trim()
    if (schoolName) payload.schoolName = schoolName
    if (schoolLocation) payload.schoolLocation = schoolLocation
    if (schoolTiming) payload.schoolTiming = schoolTiming
  }

  const notes = values.notes?.trim()
  if (notes) payload.notes = notes

  return payload
}
