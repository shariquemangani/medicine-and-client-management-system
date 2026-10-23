'use client'

import { Pencil, X, Check, CalendarPlus, User } from 'lucide-react'
import type { Patient } from '@/types'
import { PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared/page-hero'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import { getPatientDisplayName } from '@/lib/patient-display'
import { format } from 'date-fns'
import { Sk } from '@/components/patients/skeleton-bits'

interface PatientDetailHeaderProps {
  /** null while the profile is loading: static layout renders, data parts show skeletons. */
  patient: Patient | null
  isEditing: boolean
  isNewVisit?: boolean
  saving?: boolean
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
  onEdit,
  onNewVisit,
  onSave,
  onCancel,
}: PatientDetailHeaderProps) {
  const loading = !patient
  const displayName = patient ? getPatientDisplayName(patient) : ''
  const visitCount = (patient?.visitHistory?.length ?? 0) + 1

  const buttonProps = { type: 'button' as const, variant: 'outline' as const, className: heroButtonClass }

  const actions = isEditing ? (
    <>
      <Button {...buttonProps} onClick={onCancel} disabled={saving}>
        <X className="mr-1.5 h-3.5 w-3.5" />
        Cancel
      </Button>
      <Button type="button" className={heroPrimaryClass} onClick={onSave} disabled={saving}>
        {saving ? (
          'Saving...'
        ) : (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {isNewVisit ? 'Save visit' : 'Save'}
          </>
        )}
      </Button>
    </>
  ) : (
    <>
      <Button {...buttonProps} onClick={onNewVisit} disabled={loading}>
        <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
        New visit
      </Button>
      <Button {...buttonProps} onClick={onEdit} disabled={loading}>
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
    </>
  )

  const subtitle = patient ? (
    <>
      ID {patient.rollNumber} · {patient.className} · Last visit {formatVisitDate(patient.admissionDate)} ·{' '}
      {visitCount} visit{visitCount === 1 ? '' : 's'}
    </>
  ) : (
    <Sk className="h-4 w-64 max-w-full" />
  )

  return (
    <div className="col-span-full" aria-busy={loading || undefined}>
      <PageHero
        icon={User}
        badge={isEditing && isNewVisit ? 'New visit' : 'Patient profile'}
        title={patient ? displayName : 'Patient profile'}
        subtitle={subtitle}
        back={{ href: ROUTES.patients, label: 'Back to patients' }}
        actions={actions}
      />
    </div>
  )
}
