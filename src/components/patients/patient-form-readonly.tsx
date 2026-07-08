'use client'

import { format } from 'date-fns'
import { BookOpen, GraduationCap, Moon, School, ScrollText, UserRound, Users } from 'lucide-react'
import type { Patient } from '@/types'
import { DEFAULT_MEDICINE_CATEGORIES } from '@/data/medicine-categories'
import { GUARDIAN_RELATION_OTHER, splitGuardianRelation } from '@/data/guardian-relations'
import { FormFieldGrid, clinicFormGridClass } from '@/components/shared/form-field-layout'
import { PatientFormSectionHeader } from '@/components/patients/patient-form-section-header'
import { formatPhoneForDisplay } from '@/lib/phone-utils'
import { patientAdmissionDate } from '@/lib/patient-form-schema'
import { getTranslatedClassName } from '@/lib/patient-display'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

function ReadOnlyField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-sm font-medium leading-none text-foreground">{label}</p>
      <p className="clinic-form-readonly-value min-h-10 rounded-md border border-transparent bg-[hsl(var(--muted)/0.2)] px-3 py-2 text-sm text-foreground">
        {value.trim() || '—'}
      </p>
    </div>
  )
}

function formatAadharDisplay(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 12) return value || '—'
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`
}

function formatDateDisplay(value: string): string {
  if (!value) return '—'
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMM d, yyyy')
}

function useStandardLabel(classId: string, fallback: string) {
  const level = DEFAULT_MEDICINE_CATEGORIES.find((item) => item.id === classId)
  if (level) return t(level.labelKey)
  return getTranslatedClassName(fallback)
}

export function PatientIdentityReadonly({ patient }: { patient: Patient }) {

  return (
    <>
      <PatientFormSectionHeader
        accent="patients"
        title={'Patient information'}
        subtitle={'Personal details, contact & identity'}
        icon={UserRound}
        secondaryIcon={GraduationCap}
      />
      <FormFieldGrid>
        <div className="sm:col-span-2">
          <ReadOnlyField label={'Name of the patient'} value={`${patient.firstName} ${patient.lastName}`.trim()} />
        </div>
        <ReadOnlyField label={'Roll no'} value={patient.rollNumber} />
        <ReadOnlyField label={'Date of birth'} value={formatDateDisplay(patient.dateOfBirth)} />
        <ReadOnlyField
          label={'Phone number'}
          value={formatPhoneForDisplay(patient.phone) || patient.phone}
        />
        <ReadOnlyField label={'Aadhar number'} value={formatAadharDisplay(patient.aadharNumber ?? '')} />
        <ReadOnlyField label={'Email'} value={patient.email} className="sm:col-span-2" />
        <ReadOnlyField label={'Address'} value={patient.address} className="sm:col-span-2" />
      </FormFieldGrid>
    </>
  )
}

export function PatientMadrasaReadonly({ patient }: { patient: Patient }) {

  return (
    <>
      <PatientFormSectionHeader
        accent="inventory"
        title={'Madrasa'}
        arabicLabel={'المدرسة'}
        subtitle={'Islamic education & madrasa enrollment'}
        icon={Moon}
        secondaryIcon={BookOpen}
      />
      <FormFieldGrid>
        <div className="sm:col-span-2">
          <ReadOnlyField label={'Madrasa name'} value={patient.madrasaName ?? ''} />
        </div>
        <div className="sm:col-span-2">
          <ReadOnlyField label={'Madrasa location'} value={patient.madrasaLocation ?? ''} />
        </div>
        <ReadOnlyField
          label={'Date of Admission'}
          value={formatDateDisplay(patientAdmissionDate(patient))}
          className="sm:col-span-2"
        />
        <ReadOnlyField label={'Block section'} value={patient.classSection ?? ''} />
        <ReadOnlyField label={'Billing'} value={patient.fees ?? ''} />
      </FormFieldGrid>
    </>
  )
}

export function PatientAcademicReadonly({ patient }: { patient: Patient }) {
  const hasSchoolInfo = Boolean(
    patient.schoolName?.trim() || patient.schoolLocation?.trim() || patient.schoolTiming?.trim()
  )
  const standardLabel = useStandardLabel(patient.classId, patient.className)

  return (
    <>
      <PatientFormSectionHeader
        accent="medicines"
        title={'School & college'}
        subtitle={'Day institution — name, location, academic level & timing'}
        icon={School}
        secondaryIcon={GraduationCap}
      />
      {hasSchoolInfo ? (
        <FormFieldGrid>
          <div className="sm:col-span-2">
            <ReadOnlyField label={'School / college name'} value={patient.schoolName ?? ''} />
          </div>
          <div className="sm:col-span-2">
            <ReadOnlyField label={'School / college location'} value={patient.schoolLocation ?? ''} />
          </div>
          <ReadOnlyField label={'Operations level'} value={standardLabel} />
          <ReadOnlyField label={'School / college timing'} value={patient.schoolTiming ?? ''} />
        </FormFieldGrid>
      ) : (
        <div className="clinic-form-section-disabled rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">{'School & college details are turned off. Enable this section to add institution name, location, academic level, and timing.'}</p>
        </div>
      )}
    </>
  )
}

export function PatientGuardianReadonly({ patient }: { patient: Patient }) {
  const primaryRelation = splitGuardianRelation(patient.guardian.relation)
  const parents = patient.parents
  const hasSecondary = Boolean(
    parents?.motherName?.trim() ||
      parents?.motherAadhar?.trim() ||
      parents?.motherMobile?.trim()
  )
  const secondaryRelation = hasSecondary
    ? splitGuardianRelation(parents?.motherRelation ?? 'Mother')
    : { guardianRelation: '', guardianRelationOther: '' }

  const relationLabel = (relation: string, other: string) =>
    relation === GUARDIAN_RELATION_OTHER ? other : relation

  return (
    <>
      <PatientFormSectionHeader
        accent="staff"
        title={'Guardian information'}
        subtitle={'Primary contact & optional secondary guardian'}
        icon={Users}
        secondaryIcon={UserRound}
      />
      <div className={clinicFormGridClass}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--metric-staff))] sm:col-span-2">
          {'Primary guardian'}
        </p>
        <ReadOnlyField
          label={'Guardian relation'}
          value={relationLabel(primaryRelation.guardianRelation, primaryRelation.guardianRelationOther)}
          className="sm:col-span-2"
        />
        <ReadOnlyField label={'Guardian name'} value={patient.guardian.name} />
        <ReadOnlyField
          label={'Aadhar number'}
          value={formatAadharDisplay(parents?.fatherAadhar ?? '')}
        />
        <ReadOnlyField
          label={'Guardian mobile no'}
          value={formatPhoneForDisplay(patient.guardian.phone) || patient.guardian.phone}
        />

        {hasSecondary ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--metric-inventory))] sm:col-span-2">
              {'Secondary guardian'}
            </p>
            <ReadOnlyField
              label={'Guardian relation'}
              value={relationLabel(secondaryRelation.guardianRelation, secondaryRelation.guardianRelationOther)}
              className="sm:col-span-2"
            />
            <ReadOnlyField label={'Guardian name'} value={parents?.motherName ?? ''} />
            <ReadOnlyField
              label={'Aadhar number'}
              value={formatAadharDisplay(parents?.motherAadhar ?? '')}
            />
            <ReadOnlyField
              label={'Guardian mobile no'}
              value={formatPhoneForDisplay(parents?.motherMobile ?? '') || parents?.motherMobile || ''}
            />
          </>
        ) : (
          <div className="sm:col-span-2">
            <div className="clinic-form-section-disabled rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">{'Secondary guardian'} — —</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export function PatientNotesReadonly({ patient }: { patient: Patient }) {

  return (
    <>
      <PatientFormSectionHeader
        accent="prescriptions"
        title={'Admission notes'}
        subtitle={'Optional remarks recorded at enrollment'}
        icon={ScrollText}
        secondaryIcon={BookOpen}
      />
      <p className="clinic-form-readonly-value min-h-[7rem] rounded-xl border border-border/60 bg-[hsl(var(--muted)/0.15)] p-4 text-sm text-foreground">
        {patient.notes?.trim() || 'Optional — recorded at admission and visible on the patient profile'}
      </p>
    </>
  )
}
