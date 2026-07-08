'use client'

import type { Patient } from '@/types'
import { getPatientDiseaseLabels } from '@/lib/patient-stats'
import { cn } from '@/lib/utils'

const MAX_VISIBLE_DISEASES = 2

interface PatientDiseaseCellProps {
  patient: Patient
  className?: string
}

export function PatientDiseaseCell({ patient, className }: PatientDiseaseCellProps) {
  const labels = getPatientDiseaseLabels(patient)

  if (labels.length === 0) {
    return <span className={cn('text-xs text-muted-foreground', className)}>—</span>
  }

  const visible = labels.slice(0, MAX_VISIBLE_DISEASES)
  const remaining = labels.length - MAX_VISIBLE_DISEASES
  const overflowTitle = remaining > 0 ? labels.slice(MAX_VISIBLE_DISEASES).join(', ') : undefined

  return (
    <div className={cn('flex max-w-[14rem] flex-wrap items-center gap-1', className)}>
      {visible.map((label) => (
        <span key={label} className="clinic-disease-pill" title={label}>
          {label}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="clinic-disease-more" title={overflowTitle}>
          +{remaining} more
        </span>
      ) : null}
    </div>
  )
}
