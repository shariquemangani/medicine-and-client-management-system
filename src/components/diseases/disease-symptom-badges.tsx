import type { MedicineFlagOption } from '@/data/medicine-flag-fields'
import { resolveSymptomLabels } from '@/lib/diseases/disease-symptoms'
import { cn } from '@/lib/utils'

interface DiseaseSymptomBadgesProps {
  symptoms?: string[]
  symptomOptions?: Pick<MedicineFlagOption, 'value' | 'label'>[]
  className?: string
  emptyClassName?: string
  emptyLabel?: string
  maxVisible?: number
}

export function DiseaseSymptomBadges({
  symptoms,
  symptomOptions = [],
  className,
  emptyClassName,
  emptyLabel = '—',
  maxVisible,
}: DiseaseSymptomBadgesProps) {
  const labels = resolveSymptomLabels(symptoms, symptomOptions)

  if (!labels.length) {
    return <span className={cn('text-sm text-muted-foreground', emptyClassName)}>{emptyLabel}</span>
  }

  const visible = maxVisible != null ? labels.slice(0, maxVisible) : labels
  const hiddenCount = maxVisible != null ? Math.max(0, labels.length - maxVisible) : 0

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map((label) => (
        <span
          key={label}
          className="disease-symptom-badge inline-flex max-w-full items-center rounded-full border border-[hsl(var(--metric-exams)/0.28)] bg-[hsl(var(--metric-exams)/0.12)] px-2.5 py-1 text-xs font-medium text-foreground"
        >
          <span className="truncate">{label}</span>
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="disease-symptom-badge inline-flex items-center rounded-full border border-[hsl(var(--metric-exams)/0.2)] bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  )
}
