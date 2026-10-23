'use client'

import { SectionCard as KitSectionCard, SectionCardHeader } from '@/components/shared/section-card'
import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'
import type { DiseaseFormValues } from '@/types/disease'
import type { MedicineFlagOption } from '@/data/medicine-flag-fields'
import { FormRequiredMark } from '@/components/shared/form-field-layout'
import { Skel } from '@/components/medicines/skeleton-bits'
import { CreatableMultiSelect } from '@/components/shared/creatable-multi-select'
import { createFlag } from '@/services/flag-api'
import { resolveSymptomLabel } from '@/lib/diseases/disease-symptoms'
import { toast } from 'sonner'
import {
  Activity,
  Apple,
  FileText,
  HeartPulse,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

interface DiseaseVaultFormProps {
  values: DiseaseFormValues
  onChange: (values: DiseaseFormValues) => void
  disabled?: boolean
  symptomOptions: MedicineFlagOption[]
  symptomOptionsLoading?: boolean
  symptomOptionsError?: string | null
  symptomsCategoryId?: string | null
  onSymptomOptionsRefresh?: () => void
}

function FieldShell({
  label,
  required,
  children,
  className,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
  hint?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required ? <FormRequiredMark /> : null}
      </Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  delay?: number
}) {
  return (
    <KitSectionCard>
      <SectionCardHeader
        title={title}
        description={subtitle}
        icon={<Icon className="h-4 w-4" />}
      />
      <div className="space-y-4 p-5 sm:p-6">{children}</div>
    </KitSectionCard>
  )
}

export function DiseaseVaultForm({
  values,
  onChange,
  disabled,
  symptomOptions,
  symptomOptionsLoading,
  symptomOptionsError,
  symptomsCategoryId,
  onSymptomOptionsRefresh,
}: DiseaseVaultFormProps) {
  const set = <K extends keyof DiseaseFormValues>(key: K, value: DiseaseFormValues[K]) => {
    onChange({ ...values, [key]: value })
  }

  const symptomSelectOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>()
    for (const option of symptomOptions) {
      map.set(option.value, { value: option.value, label: option.label })
    }
    for (const value of values.symptoms) {
      if (!map.has(value)) {
        map.set(value, {
          value,
          label: resolveSymptomLabel(value, symptomOptions),
        })
      }
    }
    return Array.from(map.values())
  }, [symptomOptions, values.symptoms])

  const handleCreateSymptom = async (label: string) => {
    if (!symptomsCategoryId) return null
    try {
      const created = await createFlag(symptomsCategoryId, { label })
      onSymptomOptionsRefresh?.()
      return {
        value: created.value || created.label,
        label: created.label,
      }
    } catch {
      toast.error(t('diseases.createFailed'))
      return null
    }
  }

  return (
    <div className="space-y-4">
      {symptomOptionsError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {symptomOptionsError}
        </p>
      ) : null}

      <SectionCard
        title={t('diseases.form.identityTitle')}
        subtitle={t('diseases.form.identitySubtitle')}
        icon={Sparkles}
        delay={40}
      >
        <FieldShell label={t('diseases.diseaseName')} required>
          <Input
            value={values.name}
            disabled={disabled}
            placeholder={t('diseases.form.namePlaceholder')}
            className="classes-form-input h-11"
            onChange={(e) => set('name', e.target.value)}
          />
        </FieldShell>
      </SectionCard>

      <SectionCard
        title={t('diseases.form.symptomsTitle')}
        subtitle={t('diseases.form.symptomsSubtitle')}
        icon={Activity}
        delay={90}
      >
        <FieldShell
          label={t('diseases.form.symptoms')}
          hint={
            symptomOptionsLoading
              ? t('diseases.form.symptomsHint')
              : symptomOptions.length === 0
                ? t('diseases.form.flagOptionsEmpty', { field: t('diseases.form.symptoms') })
                : t('diseases.form.symptomsHint')
          }
        >
          {symptomOptionsLoading ? (
            <div className="classes-form-input flex min-h-11 flex-wrap items-center gap-2 rounded-md border px-3 py-2" aria-busy="true">
              <Skel className="h-6 w-16 rounded-full" />
              <Skel className="h-6 w-20 rounded-full" />
              <Skel className="h-6 w-14 rounded-full" />
            </div>
          ) : (
          <CreatableMultiSelect
            options={symptomSelectOptions}
            selected={values.symptoms}
            onChange={(symptoms) => set('symptoms', symptoms)}
            onCreateOption={symptomsCategoryId ? handleCreateSymptom : undefined}
            disabled={disabled}
            placeholder={t('diseases.form.symptomsPlaceholder')}
            searchPlaceholder={t('diseases.form.searchSymptoms')}
            emptyMessage={t('diseases.form.noSymptomsFound')}
            createLabel={(term) => t('diseases.form.createSymptom', { term })}
            className="classes-form-input min-h-11"
          />
          )}
        </FieldShell>
      </SectionCard>

      <SectionCard
        title={t('diseases.form.careTitle')}
        subtitle={t('diseases.form.careSubtitle')}
        icon={HeartPulse}
        delay={140}
      >
        <div className="grid grid-cols-1 gap-4">
          <FieldShell label={t('diseases.form.cure')} hint={t('diseases.form.cureHint')}>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[hsl(var(--metric-exams))]" />
              <Textarea
                value={values.cure}
                disabled={disabled}
                rows={4}
                placeholder={t('diseases.form.curePlaceholder')}
                className="classes-form-input min-h-[108px] resize-y pl-9"
                onChange={(e) => set('cure', e.target.value)}
              />
            </div>
          </FieldShell>
          <FieldShell label={t('diseases.form.diet')} hint={t('diseases.form.dietHint')}>
            <div className="relative">
              <Apple className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-emerald-500" />
              <Textarea
                value={values.diet}
                disabled={disabled}
                rows={4}
                placeholder={t('diseases.form.dietPlaceholder')}
                className="classes-form-input min-h-[108px] resize-y pl-9"
                onChange={(e) => set('diet', e.target.value)}
              />
            </div>
          </FieldShell>
          <FieldShell label={t('diseases.form.precautions')} hint={t('diseases.form.precautionsHint')}>
            <div className="relative">
              <ShieldAlert className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-amber-500" />
              <Textarea
                value={values.precautions}
                disabled={disabled}
                rows={4}
                placeholder={t('diseases.form.precautionsPlaceholder')}
                className="classes-form-input min-h-[108px] resize-y pl-9"
                onChange={(e) => set('precautions', e.target.value)}
              />
            </div>
          </FieldShell>
        </div>
      </SectionCard>

    </div>
  )
}
