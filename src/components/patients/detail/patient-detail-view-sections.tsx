'use client'

import type { ReactNode } from 'react'
import {
  CalendarDays,
  ClipboardList,
  IndianRupee,
  Leaf,
  MapPin,
  Phone,
  Pill,
  Sparkles,
  Stethoscope,
  UserRound,
  Wallet,
} from 'lucide-react'
import { format } from 'date-fns'
import { BentoCard } from '@/components/shared'
import { PatientFormSectionHeader } from '@/components/patients/patient-form-section-header'
import { formatPrescribedMedicineDisplay } from '@/lib/patients/patient-registration-mapper'
import { formatPatientAmount, getPatientDiseaseLabels } from '@/lib/patient-stats'
import { formatPhoneForDisplay } from '@/lib/phone-utils'
import type { Patient } from '@/types'
import { cn } from '@/lib/utils'

interface PatientDetailViewSectionsProps {
  patient: Patient
}

function formatVisitDate(value?: string): string {
  if (!value?.trim()) return '—'
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMMM d, yyyy')
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export function PatientDetailViewSections({ patient }: PatientDetailViewSectionsProps) {
  const diseaseLabels = getPatientDiseaseLabels(patient)
  const medicines = patient.prescribedMedicines ?? []
  const dietItems = patient.dietPlan ?? []

  return (
    <>
      <BentoCard colSpan={6} accent="patients" delay={60}>
        <PatientFormSectionHeader
          accent="patients"
          title="Patient details"
          subtitle="Visit date, name, contact, and address"
          icon={UserRound}
          secondaryIcon={CalendarDays}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Visit date" value={formatVisitDate(patient.admissionDate)} />
          <DetailField
            label="Patient name"
            value={`${patient.firstName} ${patient.lastName}`.trim() || '—'}
          />
          <DetailField
            label="Contact"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                {formatPhoneForDisplay(patient.phone) || patient.phone || '—'}
              </span>
            }
          />
          <DetailField
            label="Patient ID"
            value={<span className="font-mono text-xs sm:text-sm">{patient.rollNumber}</span>}
          />
          <DetailField
            label="Address"
            className="sm:col-span-2"
            value={
              <span className="inline-flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                {patient.address?.trim() || '—'}
              </span>
            }
          />
        </div>
      </BentoCard>

      <BentoCard colSpan={6} accent="prescriptions" delay={120}>
        <PatientFormSectionHeader
          accent="prescriptions"
          title="Consultation"
          subtitle="Disease and prescription details"
          icon={Stethoscope}
          secondaryIcon={ClipboardList}
        />
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Diseases
            </p>
            {diseaseLabels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {diseaseLabels.map((label) => (
                  <span
                    key={label}
                    className="clinic-accent-pill clinic-accent-pill-prescriptions rounded-full px-2.5 py-1 text-xs font-medium"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
          <DetailField
            label="Prescription"
            value={
              patient.prescription?.trim() ? (
                <p className="whitespace-pre-wrap font-normal leading-relaxed text-foreground/90">
                  {patient.prescription}
                </p>
              ) : (
                '—'
              )
            }
          />
        </div>
      </BentoCard>

      <BentoCard colSpan={12} accent="medicines" delay={180}>
        <PatientFormSectionHeader
          accent="medicines"
          title="Medicines"
          subtitle={`${medicines.length} prescribed medicine${medicines.length === 1 ? '' : 's'}`}
          icon={Pill}
        />
        {medicines.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-6 text-center text-sm text-muted-foreground">
            No medicines prescribed for this visit.
          </p>
        ) : (
          <div className="space-y-2">
            {medicines.map((medicine, index) => (
              <div
                key={`${medicine.medicineIds.join('-')}-${index}`}
                className="patient-medicine-view-row flex items-start gap-3 rounded-xl border border-border/60 bg-[hsl(var(--muted)/0.12)] px-4 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--metric-medicines)/0.12)] text-xs font-bold text-[hsl(var(--metric-medicines))]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {medicine.medicineNames?.join(', ') || 'Medicine'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatPrescribedMedicineDisplay(medicine)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      <BentoCard colSpan={12} accent="inventory" delay={240}>
        <PatientFormSectionHeader
          accent="inventory"
          title="Diet"
          subtitle="Dietary advice with amounts"
          icon={Leaf}
        />
        {dietItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-6 text-center text-sm text-muted-foreground">
            No diet recommendations recorded.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {dietItems.map((item) => (
              <div
                key={`${item.item}-${item.amount}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-[hsl(var(--muted)/0.12)] px-4 py-3"
              >
                <span className="text-sm font-medium text-foreground">{item.item}</span>
                <span className="text-sm text-muted-foreground">{item.amount}</span>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      <BentoCard colSpan={12} accent="prescriptions" delay={300}>
        <PatientFormSectionHeader
          accent="prescriptions"
          title="Additional notes"
          subtitle="Remarks for this visit"
          icon={ClipboardList}
        />
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {patient.additionalNotes?.trim() || '—'}
        </p>
      </BentoCard>

      <BentoCard colSpan={12} accent="fees" delay={360}>
        <PatientFormSectionHeader
          accent="fees"
          title="Fees from patient"
          subtitle="Consultation and treatment charges for this visit"
          icon={Wallet}
          secondaryIcon={Sparkles}
        />
        <div className="patient-fees-panel relative overflow-hidden rounded-2xl border border-[hsl(var(--metric-fees)/0.28)] bg-[hsl(var(--metric-fees)/0.06)] p-4 sm:p-5">
          <div className="patient-fees-mesh pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10 flex items-end gap-2">
            <IndianRupee
              className="mb-1 h-6 w-6 shrink-0 text-[hsl(var(--metric-fees))]"
              aria-hidden
            />
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
              {formatPatientAmount(patient.fees).replace('₹', '').trim()}
            </p>
          </div>
        </div>
      </BentoCard>
    </>
  )
}
