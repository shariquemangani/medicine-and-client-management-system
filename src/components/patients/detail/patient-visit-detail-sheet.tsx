'use client'

import { format } from 'date-fns'
import {
  CalendarDays,
  ClipboardList,
  IndianRupee,
  Leaf,
  Pill,
  Sparkles,
  Stethoscope,
  Wallet,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatPrescribedMedicineDisplay } from '@/lib/patients/patient-registration-mapper'
import { formatPatientAmount } from '@/lib/patient-stats'
import type { PatientVisitRecord } from '@/types/patient-visit'
import { cn } from '@/lib/utils'

interface PatientVisitDetailSheetProps {
  visit: PatientVisitRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName?: string
  isCurrent?: boolean
}

function formatRecordDate(value?: string): string {
  if (!value?.trim()) return 'Unknown date'
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'EEEE, MMMM d, yyyy')
}

function formatRecordedAt(value?: string): string {
  if (!value?.trim()) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return format(date, 'MMM d, yyyy · h:mm a')
}

function getVisitDiseaseLabels(visit: PatientVisitRecord): string[] {
  const labels = visit.diseaseLabels?.filter(Boolean) ?? []
  if (labels.length > 0) return labels
  if (!visit.disease?.trim()) return []
  return visit.disease
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function PatientVisitDetailSheet({
  visit,
  open,
  onOpenChange,
  patientName,
  isCurrent,
}: PatientVisitDetailSheetProps) {
  if (!visit) return null

  const diseaseLabels = getVisitDiseaseLabels(visit)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="patient-visit-detail-sheet w-full overflow-y-auto border-l border-[hsl(var(--glass-border))] bg-background/95 p-0 backdrop-blur-xl sm:max-w-xl"
      >
        <div className="patient-visit-detail-hero relative overflow-hidden border-b border-[hsl(var(--glass-border))] px-6 pb-5 pt-6">
          <div className="patient-visit-detail-mesh pointer-events-none absolute inset-0" aria-hidden />
          <SheetHeader className="relative z-10 space-y-3 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {isCurrent ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--metric-patients)/0.15)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--metric-patients))]">
                  <Sparkles className="h-3 w-3" />
                  Current visit
                </span>
              ) : (
                <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Archived visit
                </span>
              )}
            </div>
            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
              {formatRecordDate(visit.visitDate)}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {patientName ? `${patientName} · ` : ''}
              {isCurrent
                ? 'Active consultation record'
                : visit.recordedAt
                  ? `Archived ${formatRecordedAt(visit.recordedAt)}`
                  : 'Past consultation record'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <section className="patient-visit-detail-section">
            <h3 className="patient-visit-detail-section-title">
              <Stethoscope className="h-4 w-4" />
              Consultation
            </h3>
            {diseaseLabels.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
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
              <p className="mt-2 text-sm text-muted-foreground">No diseases recorded.</p>
            )}
            {visit.prescription?.trim() ? (
              <p className="mt-3 whitespace-pre-wrap rounded-xl border border-border/60 bg-muted/15 p-3 text-sm leading-relaxed text-foreground/90">
                {visit.prescription}
              </p>
            ) : null}
          </section>

          <section className="patient-visit-detail-section">
            <h3 className="patient-visit-detail-section-title">
              <Pill className="h-4 w-4" />
              Medicines ({visit.prescribedMedicines.length})
            </h3>
            {visit.prescribedMedicines.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No medicines prescribed.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {visit.prescribedMedicines.map((medicine, index) => (
                  <div
                    key={`${visit.id}-detail-med-${index}`}
                    className="rounded-xl border border-border/60 bg-[hsl(var(--muted)/0.12)] px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {medicine.medicineNames?.join(', ') || 'Medicine'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatPrescribedMedicineDisplay(medicine)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="patient-visit-detail-section">
            <h3 className="patient-visit-detail-section-title">
              <Leaf className="h-4 w-4" />
              Diet
            </h3>
            {visit.dietPlan.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No diet plan recorded.</p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {visit.dietPlan.map((item) => (
                  <div
                    key={`${visit.id}-${item.item}`}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-[hsl(var(--muted)/0.12)] px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-foreground">{item.item}</span>
                    <span className="text-muted-foreground">{item.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {visit.additionalNotes?.trim() ? (
            <section className="patient-visit-detail-section">
              <h3 className="patient-visit-detail-section-title">
                <ClipboardList className="h-4 w-4" />
                Additional notes
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {visit.additionalNotes}
              </p>
            </section>
          ) : null}

          <section
            className={cn(
              'patient-visit-detail-fees relative overflow-hidden rounded-2xl border border-[hsl(var(--metric-fees)/0.28)] bg-[hsl(var(--metric-fees)/0.06)] p-4'
            )}
          >
            <div className="patient-fees-mesh pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative z-10">
              <h3 className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[hsl(var(--metric-fees))]">
                <Wallet className="h-3.5 w-3.5" />
                Visit fees
              </h3>
              <div className="mt-2 flex items-end gap-2">
                <IndianRupee className="mb-1 h-5 w-5 text-[hsl(var(--metric-fees))]" aria-hidden />
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {formatPatientAmount(visit.fees).replace('₹', '').trim()}
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Visit date: {formatRecordDate(visit.visitDate)}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
