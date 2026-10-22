'use client'

import { ChevronLeft, Pencil, X, Check, CalendarPlus } from 'lucide-react'
import type { Patient } from '@/types'
import { BentoCard } from '@/components/shared'
import { StatusBadge } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { getPatientDisplayName, getPatientDisplayInitials } from '@/lib/patient-display'
import { format } from 'date-fns'
import { Sk } from '@/components/patients/skeleton-bits'

interface PatientDetailHeaderProps {
  /** null while the profile is loading: static layout renders, data parts show skeletons. */
  patient: Patient | null
  isEditing: boolean
  isNewVisit?: boolean
  saving?: boolean
  onBack: () => void
  onEdit: () => void
  onNewVisit: () => void
  onSave: () => void
  onCancel: () => void
}

function formatVisitDate(value?: string): string {
  if (!value?.trim()) return '—'
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMM d, yyyy')
}

export function PatientDetailHeader({
  patient,
  isEditing,
  isNewVisit,
  saving,
  onBack,
  onEdit,
  onNewVisit,
  onSave,
  onCancel,
}: PatientDetailHeaderProps) {
  const loading = !patient
  const displayName = patient ? getPatientDisplayName(patient) : ''
  const initials = patient ? getPatientDisplayInitials(patient) : ''
  const visitCount = (patient?.visitHistory?.length ?? 0) + 1

  return (
    <BentoCard colSpan={12} delay={0} className="!p-0">
      <div className="clinic-create-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
        <div className="clinic-hero-mesh pointer-events-none" aria-hidden />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="clinic-hero-btn shrink-0"
              onClick={onBack}
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            {patient ? (
              <div className="clinic-avatar flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold">
                {initials}
              </div>
            ) : (
              <Sk className="h-14 w-14 shrink-0 rounded-2xl" />
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {patient ? <StatusBadge status={patient.status} /> : <Sk className="h-5 w-16 rounded-full" />}
                <span className="clinic-accent-pill clinic-accent-pill-patients">Patient profile</span>
                {isEditing && isNewVisit ? (
                  <span className="clinic-accent-pill clinic-accent-pill-patients">New visit</span>
                ) : null}
              </div>
              {patient ? (
                <>
                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {displayName}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ID {patient.rollNumber} · {patient.className} · Last visit{' '}
                    {formatVisitDate(patient.admissionDate)} · {visitCount} visit
                    {visitCount === 1 ? '' : 's'}
                  </p>
                </>
              ) : (
                <div aria-busy="true">
                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Patient profile</h1>
                  <Sk className="mt-2 h-4 w-72 max-w-full" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="clinic-hero-btn"
                  onClick={onCancel}
                  disabled={saving}
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="button" className="clinic-hero-primary" onClick={onSave} disabled={saving}>
                  {saving ? (
                    <>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-1.5 h-4 w-4" />
                      {isNewVisit ? 'Save visit' : 'Save'}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="clinic-hero-btn"
                  onClick={onNewVisit}
                  disabled={loading}
                >
                  <CalendarPlus className="mr-1.5 h-4 w-4" />
                  New visit
                </Button>
                <Button type="button" variant="outline" className="clinic-hero-btn" onClick={onEdit} disabled={loading}>
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </BentoCard>
  )
}
