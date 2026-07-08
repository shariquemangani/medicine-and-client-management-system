'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'
import type { MedicineFormValues } from '@/types/medicine'
import type { MedicineFlagFieldOptions } from '@/data/medicine-flag-fields'
import { FormRequiredMark } from '@/components/shared/form-field-layout'
import { CreatableMultiSelect } from '@/components/shared/creatable-multi-select'
import { createFlag } from '@/services/flag-api'
import { toast } from 'sonner'
import {
  Activity,
  Beaker,
  FileText,
  FlaskConical,
  Loader2,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'

interface MedicineVaultFormProps {
  values: MedicineFormValues
  onChange: (values: MedicineFormValues) => void
  disabled?: boolean
  flagOptions: MedicineFlagFieldOptions
  flagOptionsLoading?: boolean
  flagOptionsError?: string | null
  symptomsCategoryId?: string | null
  onFlagOptionsRefresh?: () => void
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
  delay = 0,
}: {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  delay?: number
}) {
  return (
    <section
      className="medicine-vault-section"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="medicine-vault-section-glow" aria-hidden />
      <div className="relative z-10 space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--metric-classes)/0.14)] text-[hsl(var(--metric-classes))]">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  )
}

function SelectLoadingState({ text }: { text: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
      <span className="truncate">{text}</span>
    </div>
  )
}

function FlagSelect({
  value,
  options,
  disabled,
  loading,
  loadingText,
  placeholder,
  onValueChange,
}: {
  value: string
  options: { value: string; label: string }[]
  disabled?: boolean
  loading?: boolean
  loadingText: string
  placeholder: string
  onValueChange: (value: string) => void
}) {
  const known = options.some((o) => o.value === value)
  const selectValue = value && known ? value : undefined

  return (
    <Select
      value={selectValue}
      disabled={disabled || loading || (!loading && options.length === 0)}
      onValueChange={onValueChange}
    >
      <SelectTrigger className="classes-form-input h-11">
        {loading ? (
          <SelectLoadingState text={loadingText} />
        ) : (
          <SelectValue placeholder={placeholder} />
        )}
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <div className="flex items-center gap-2 whitespace-nowrap px-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
            <span>{loadingText}</span>
          </div>
        ) : options.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">{placeholder}</div>
        ) : (
          options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}

export function MedicineVaultForm({
  values,
  onChange,
  disabled,
  flagOptions,
  flagOptionsLoading,
  flagOptionsError,
  symptomsCategoryId,
  onFlagOptionsRefresh,
}: MedicineVaultFormProps) {
  const set = <K extends keyof MedicineFormValues>(key: K, value: MedicineFormValues[K]) => {
    onChange({ ...values, [key]: value })
  }

  const togglePotency = (potency: string) => {
    const exists = values.potencies.includes(potency)
    set(
      'potencies',
      exists ? values.potencies.filter((p) => p !== potency) : [...values.potencies, potency]
    )
  }

  const symptomSelectOptions = flagOptions.symptoms.map((o) => ({
    value: o.value,
    label: o.label,
  }))

  const handleCreateSymptom = async (label: string) => {
    if (!symptomsCategoryId) return null
    try {
      const created = await createFlag(symptomsCategoryId, { label })
      onFlagOptionsRefresh?.()
      return {
        value: created.value || created.label,
        label: created.label,
      }
    } catch {
      toast.error(t('medicines.createFailed'))
      return null
    }
  }

  return (
    <div className="space-y-4">
      {flagOptionsError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {flagOptionsError}
        </p>
      ) : null}

      <SectionCard
        title={t('medicines.form.identityTitle')}
        subtitle={t('medicines.form.identitySubtitle')}
        icon={Sparkles}
        delay={40}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldShell label={t('medicines.medicineName')} required>
            <Input
              value={values.name}
              disabled={disabled}
              placeholder={t('medicines.medicineNamePlaceholder')}
              className="classes-form-input h-11"
              onChange={(e) => set('name', e.target.value)}
            />
          </FieldShell>
          <FieldShell label={t('medicines.form.commonName')}>
            <Input
              value={values.commonName}
              disabled={disabled}
              placeholder={t('medicines.form.commonNamePlaceholder')}
              className="classes-form-input h-11"
              onChange={(e) => set('commonName', e.target.value)}
            />
          </FieldShell>
          <FieldShell
            label={t('medicines.form.formType')}
            hint={
              !flagOptionsLoading && flagOptions.formType.length === 0
                ? t('medicines.form.flagOptionsEmpty', { field: t('medicines.form.formType') })
                : undefined
            }
          >
            <FlagSelect
              value={values.formType}
              options={flagOptions.formType}
              disabled={disabled}
              loading={flagOptionsLoading}
              loadingText={t('medicines.form.loadingFormType')}
              placeholder={t('medicines.form.selectFlagOption')}
              onValueChange={(v) => set('formType', v)}
            />
          </FieldShell>
          <FieldShell
            label={t('medicines.form.status')}
            hint={
              !flagOptionsLoading && flagOptions.status.length === 0
                ? t('medicines.form.flagOptionsEmpty', { field: t('medicines.form.status') })
                : undefined
            }
          >
            <FlagSelect
              value={values.status}
              options={flagOptions.status}
              disabled={disabled}
              loading={flagOptionsLoading}
              loadingText={t('medicines.form.loadingStatus')}
              placeholder={t('medicines.form.selectFlagOption')}
              onValueChange={(v) => set('status', v)}
            />
          </FieldShell>
        </div>
      </SectionCard>

      <SectionCard
        title={t('medicines.form.potencyTitle')}
        subtitle={t('medicines.form.potencySubtitle')}
        icon={FlaskConical}
        delay={90}
      >
        {flagOptionsLoading ? (
          <div className="flex items-center gap-2 whitespace-nowrap py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            <span>{t('medicines.form.loadingPotencies')}</span>
          </div>
        ) : flagOptions.potencies.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('medicines.form.flagOptionsEmpty', { field: t('medicines.form.potencyTitle') })}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {flagOptions.potencies.map((opt) => {
              const active = values.potencies.includes(opt.value)
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => togglePotency(opt.value)}
                  className={cn(
                    'medicine-potency-chip',
                    active && 'medicine-potency-chip-active'
                  )}
                >
                  {opt.label}
                  {active ? <X className="ml-1 h-3 w-3 opacity-70" /> : null}
                </button>
              )
            })}
          </div>
        )}
        {values.potencies.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {values.potencies.map((p) => {
              const label =
                flagOptions.potencies.find((o) => o.value === p)?.label ?? p
              return (
                <Badge key={p} variant="secondary" className="font-mono text-[11px]">
                  {label}
                </Badge>
              )
            })}
          </div>
        ) : !flagOptionsLoading && flagOptions.potencies.length > 0 ? (
          <p className="text-xs text-muted-foreground">{t('medicines.form.noPotencies')}</p>
        ) : null}
      </SectionCard>

      <SectionCard
        title={t('medicines.form.clinicalTitle')}
        subtitle={t('medicines.form.clinicalSubtitle')}
        icon={Activity}
        delay={140}
      >
        <div className="grid grid-cols-1 gap-4">
          <FieldShell
            label={t('medicines.form.symptoms')}
            hint={
              flagOptionsLoading
                ? t('medicines.form.loadingSymptoms')
                : !flagOptionsLoading && flagOptions.symptoms.length === 0
                  ? t('medicines.form.flagOptionsEmpty', { field: t('medicines.form.symptoms') })
                  : t('medicines.form.symptomsHint')
            }
          >
            <CreatableMultiSelect
              options={symptomSelectOptions}
              selected={values.symptoms}
              onChange={(symptoms) => set('symptoms', symptoms)}
              onCreateOption={symptomsCategoryId ? handleCreateSymptom : undefined}
              disabled={disabled || flagOptionsLoading}
              placeholder={
                flagOptionsLoading
                  ? t('medicines.form.loadingSymptoms')
                  : t('medicines.form.symptomsPlaceholder')
              }
              searchPlaceholder={t('medicines.form.searchSymptoms')}
              emptyMessage={t('medicines.form.noSymptomsFound')}
              createLabel={(term) => t('medicines.form.createSymptom', { term })}
              className="classes-form-input min-h-11"
            />
          </FieldShell>
          <FieldShell
            label={t('medicines.information')}
            hint={t('medicines.form.informationHint')}
          >
            <Textarea
              value={values.information}
              disabled={disabled}
              rows={3}
              placeholder={t('medicines.form.informationPlaceholder')}
              className="classes-form-input min-h-[88px] resize-y"
              onChange={(e) => set('information', e.target.value)}
            />
          </FieldShell>
        </div>
      </SectionCard>

      <SectionCard
        title={t('medicines.form.safetyTitle')}
        subtitle={t('medicines.form.safetySubtitle')}
        icon={ShieldAlert}
        delay={190}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldShell label={t('medicines.form.antidotes')}>
            <div className="relative">
              <Beaker className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[hsl(var(--metric-classes))]" />
              <Textarea
                value={values.antidotes}
                disabled={disabled}
                rows={4}
                placeholder={t('medicines.form.antidotesPlaceholder')}
                className="classes-form-input min-h-[108px] resize-y pl-9"
                onChange={(e) => set('antidotes', e.target.value)}
              />
            </div>
          </FieldShell>
          <FieldShell label={t('medicines.form.caution')}>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-amber-500" />
              <Textarea
                value={values.cautionNotes}
                disabled={disabled}
                rows={4}
                placeholder={t('medicines.form.cautionPlaceholder')}
                className="classes-form-input min-h-[108px] resize-y pl-9"
                onChange={(e) => set('cautionNotes', e.target.value)}
              />
            </div>
          </FieldShell>
        </div>
      </SectionCard>
    </div>
  )
}
