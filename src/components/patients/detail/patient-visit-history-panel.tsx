'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  History,
  IndianRupee,
  Pill,
  Sparkles,
  Stethoscope,
  Wallet,
} from 'lucide-react'
import { AnimatedStat, BentoCard } from '@/components/shared'
import { PatientFormSectionHeader } from '@/components/patients/patient-form-section-header'
import { PatientVisitDetailSheet } from '@/components/patients/detail/patient-visit-detail-sheet'
import { Button } from '@/components/ui/button'
import { formatPatientAmount, getPatientDiseaseLabels, parsePatientAmount } from '@/lib/patient-stats'
import { getPatientDisplayName } from '@/lib/patient-display'
import type { Patient } from '@/types'
import type { PatientVisitRecord } from '@/types/patient-visit'
import { cn } from '@/lib/utils'

interface PatientVisitHistoryPanelProps {
  patient: Patient
  currentVisitDate?: string
}

interface TimelineVisit extends PatientVisitRecord {
  isCurrent?: boolean
}

function formatRecordDate(value?: string): string {
  if (!value?.trim()) return 'Unknown'
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMM d, yyyy')
}

function formatRecordDay(value?: string): string {
  if (!value?.trim()) return '—'
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, 'dd')
}

function formatRecordMonth(value?: string): string {
  if (!value?.trim()) return ''
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return format(date, 'MMM yyyy')
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

function TimelineNode({
  visit,
  index,
  onViewDetails,
}: {
  visit: TimelineVisit
  index: number
  onViewDetails: (visit: TimelineVisit) => void
}) {
  const diseaseLabels = getVisitDiseaseLabels(visit)
  const medicineCount = visit.prescribedMedicines.length
  const dietCount = visit.dietPlan.length

  return (
    <article
      className="patient-timeline-node group"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="patient-timeline-rail" aria-hidden>
        <div
          className={cn(
            'patient-timeline-dot',
            visit.isCurrent && 'patient-timeline-dot-active'
          )}
        >
          {visit.isCurrent ? <Sparkles className="h-3.5 w-3.5" /> : null}
        </div>
        <div className="patient-timeline-connector" />
      </div>

      <div
        className={cn(
          'patient-timeline-card relative min-w-0 flex-1 overflow-hidden rounded-2xl border transition-all duration-300',
          visit.isCurrent
            ? 'border-[hsl(var(--metric-patients)/0.45)] bg-[hsl(var(--metric-patients)/0.07)] shadow-[0_12px_40px_-24px_hsl(var(--metric-patients)/0.45)]'
            : 'border-border/70 bg-[hsl(var(--muted)/0.1)] hover:border-[hsl(var(--metric-patients)/0.25)] hover:bg-[hsl(var(--muted)/0.16)]'
        )}
      >
        <div className="patient-visit-card-glow pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative z-10 flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
          <div className="patient-timeline-date-badge shrink-0 text-center sm:w-16">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {formatRecordMonth(visit.visitDate)}
            </p>
            <p className="text-2xl font-bold tabular-nums leading-none text-foreground">
              {formatRecordDay(visit.visitDate)}
            </p>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                {visit.isCurrent ? 'Current visit' : 'Past visit'}
              </h3>
              {visit.isCurrent ? (
                <span className="rounded-full bg-[hsl(var(--metric-patients)/0.15)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--metric-patients))]">
                  Active
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">{formatRecordDate(visit.visitDate)}</span>
            </div>

            {diseaseLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {diseaseLabels.slice(0, 4).map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[11px] font-medium text-foreground/85"
                  >
                    {label}
                  </span>
                ))}
                {diseaseLabels.length > 4 ? (
                  <span className="text-[11px] text-muted-foreground">
                    +{diseaseLabels.length - 4}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No diseases recorded</p>
            )}

            <div className="flex flex-wrap gap-2">
              <span className="patient-timeline-stat-chip inline-flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-[hsl(var(--metric-medicines))]" />
                {medicineCount} medicine{medicineCount === 1 ? '' : 's'}
              </span>
              <span className="patient-timeline-stat-chip inline-flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-[hsl(var(--metric-prescriptions))]" />
                {dietCount} diet item{dietCount === 1 ? '' : 's'}
              </span>
              <span className="patient-timeline-stat-chip inline-flex items-center gap-1.5 text-[hsl(var(--metric-fees))]">
                <IndianRupee className="h-3.5 w-3.5" />
                {formatPatientAmount(visit.fees).replace('₹', '').trim()}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="patient-timeline-view-btn clinic-hero-btn shrink-0 gap-1.5 self-start"
            onClick={() => onViewDetails(visit)}
          >
            View details
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  )
}

export function PatientVisitHistoryPanel({ patient, currentVisitDate }: PatientVisitHistoryPanelProps) {
  const [selectedVisit, setSelectedVisit] = useState<TimelineVisit | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const currentVisit: TimelineVisit = useMemo(
    () => ({
      id: 'current',
      visitDate: currentVisitDate ?? patient.admissionDate ?? patient.dateOfBirth ?? '',
      recordedAt: patient.updatedAt,
      diseases: patient.diseases ?? [],
      diseaseLabels: patient.diseaseLabels ?? [],
      disease: patient.disease,
      prescription: patient.prescription,
      prescribedMedicines: patient.prescribedMedicines ?? [],
      dietPlan: patient.dietPlan ?? [],
      additionalNotes: patient.additionalNotes,
      fees: patient.fees,
      summary: patient.notes,
      isCurrent: true,
    }),
    [patient, currentVisitDate]
  )

  const timelineVisits = useMemo(() => {
    const history = [...(patient.visitHistory ?? [])].sort((a, b) =>
      b.visitDate.localeCompare(a.visitDate)
    )
    return [currentVisit, ...history]
  }, [patient.visitHistory, currentVisit])

  const totalVisits = timelineVisits.length
  const archivedCount = patient.visitHistory?.length ?? 0
  const totalFees = Math.round(
    timelineVisits.reduce((sum, visit) => sum + parsePatientAmount(visit.fees), 0)
  )
  const lastArchived = [...(patient.visitHistory ?? [])].sort((a, b) =>
    b.visitDate.localeCompare(a.visitDate)
  )[0]

  const handleViewDetails = (visit: TimelineVisit) => {
    setSelectedVisit(visit)
    setDetailOpen(true)
  }

  return (
    <>
      <BentoCard colSpan={6} accent="patients" delay={60}>
        <AnimatedStat
          title="Total Visits"
          value={totalVisits}
          icon={History}
          accent="patients"
          compact
        />
      </BentoCard>

      <BentoCard colSpan={6} accent="fees" delay={120}>
        <AnimatedStat
          title="Combined Fees"
          value={totalFees}
          icon={Wallet}
          accent="fees"
          currency
          compact
        />
      </BentoCard>

      <BentoCard colSpan={12} accent="patients" delay={180}>
        <PatientFormSectionHeader
          accent="patients"
          title="Visit timeline"
          subtitle="Chronological record of every consultation"
          icon={History}
          secondaryIcon={Clock3}
        />

        <div className="patient-timeline-track space-y-0">
          {timelineVisits.map((visit, index) => (
            <TimelineNode
              key={visit.id}
              visit={visit}
              index={index}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>

        {archivedCount === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
            No archived visits yet. Use <strong className="font-medium text-foreground">New visit</strong>{' '}
            to record a follow-up
            {getPatientDiseaseLabels(patient).length
              ? ` — current diseases: ${getPatientDiseaseLabels(patient).slice(0, 2).join(', ')}`
              : ''}
            .
          </p>
        ) : lastArchived ? (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Last archived visit: {formatRecordDate(lastArchived.visitDate)}
          </p>
        ) : null}
      </BentoCard>

      <PatientVisitDetailSheet
        visit={selectedVisit}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        patientName={getPatientDisplayName(patient)}
        isCurrent={selectedVisit?.isCurrent}
      />
    </>
  )
}
