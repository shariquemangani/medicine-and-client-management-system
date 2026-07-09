'use client'

import { ROUTES } from '@/lib/routes'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'
import type { Medicine } from '@/types/medicine'
import type { MedicineFlagFieldOptions } from '@/data/medicine-flag-fields'
import { getMedicineSymptoms } from '@/lib/medicines/medicine-form'
import {
  Activity,
  ArrowLeft,
  FlaskConical,
  Pencil,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

function resolveFlagLabel(
  value: string | undefined,
  options: { value: string; label: string }[]
): string {
  if (!value?.trim()) return '—'
  return options.find((o) => o.value === value)?.label ?? value
}

function DetailSection({
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
    <section className="medicine-vault-section" style={{ animationDelay: `${delay}ms` }}>
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

function DetailField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  const empty =
    children === null ||
    children === undefined ||
    (typeof children === 'string' && children.trim().length === 0)

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      {empty ? (
        <p className="text-sm italic text-muted-foreground/70">{t('medicines.detail.emptyField')}</p>
      ) : (
        <div className="text-sm leading-relaxed text-foreground">{children}</div>
      )}
    </div>
  )
}

interface MedicineDetailHeaderProps {
  name: string
  commonName?: string
  onEdit?: () => void
  actions?: React.ReactNode
}

export function MedicineDetailHeader({ name, commonName, onEdit, actions }: MedicineDetailHeaderProps) {
  return (
    <div className="medicine-detail-hero">
      <div className="medicine-detail-hero-orbit" aria-hidden />
      <div className="medicine-detail-hero-grid" aria-hidden />
      <div className="relative z-10 flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <Link href={ROUTES.vaultMedicine}>
              <ArrowLeft className="h-4 w-4" />
              {t('medicines.detail.back')}
            </Link>
          </Button>
          {actions ?? (
            onEdit ? (
              <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                {t('common.edit')}
              </Button>
            ) : null
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{name}</h1>
          {commonName?.trim() ? (
            <p className="text-base italic text-muted-foreground">{commonName}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground/60">{t('medicines.detail.emptyField')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface MedicineDetailViewProps {
  medicine: Medicine
  flagOptions?: MedicineFlagFieldOptions
  onEdit?: () => void
}

export function MedicineDetailView({ medicine, flagOptions, onEdit }: MedicineDetailViewProps) {
  const formOptions = flagOptions?.formType ?? []
  const statusOptions = flagOptions?.status ?? []
  const potencyOptions = flagOptions?.potencies ?? []
  const symptomOptions = flagOptions?.symptoms ?? []

  const formLabel = resolveFlagLabel(medicine.formType, formOptions)
  const statusLabel = resolveFlagLabel(medicine.status, statusOptions)
  const symptoms = getMedicineSymptoms(medicine).map(
    (value) => symptomOptions.find((o) => o.value === value)?.label ?? value
  )
  const potencies = (medicine.potencies ?? []).map(
    (value) => potencyOptions.find((o) => o.value === value)?.label ?? value
  )

  const isInactive =
    (medicine.status ?? '').toLowerCase() === 'archived' ||
    (medicine.status ?? '').toLowerCase() === 'inactive'

  return (
    <div className="medicine-detail-shell space-y-4">
      <MedicineDetailHeader
        name={medicine.name}
        commonName={medicine.commonName}
        onEdit={onEdit}
      />

      <DetailSection
        title={t('medicines.form.identityTitle')}
        subtitle={t('medicines.form.identitySubtitle')}
        icon={Sparkles}
        delay={40}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailField label={t('medicines.form.formType')}>
            <Badge variant="outline" className="capitalize font-normal">
              {formLabel}
            </Badge>
          </DetailField>
          <DetailField label={t('medicines.form.status')}>
            <Badge variant={isInactive ? 'secondary' : 'default'} className="capitalize font-normal">
              {statusLabel}
            </Badge>
          </DetailField>
        </div>
      </DetailSection>

      <DetailSection
        title={t('medicines.form.potencyTitle')}
        subtitle={t('medicines.form.potencySubtitle')}
        icon={FlaskConical}
        delay={90}
      >
        {potencies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {potencies.map((potency) => (
              <span
                key={potency}
                className="medicine-potency-chip medicine-potency-chip-active cursor-default"
              >
                {potency}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground/70">{t('medicines.form.noPotencies')}</p>
        )}
      </DetailSection>

      <DetailSection
        title={t('medicines.form.clinicalTitle')}
        subtitle={t('medicines.form.clinicalSubtitle')}
        icon={Activity}
        delay={140}
      >
        <div className="grid grid-cols-1 gap-4">
          <DetailField label={t('medicines.form.symptoms')}>
            {symptoms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <span key={symptom} className="medicine-symptom-chip medicine-symptom-chip-readonly">
                    {symptom}
                  </span>
                ))}
              </div>
            ) : null}
          </DetailField>
          <DetailField label={t('medicines.information')}>
            {medicine.information?.trim() ? (
              <p className="whitespace-pre-wrap">{medicine.information}</p>
            ) : null}
          </DetailField>
        </div>
      </DetailSection>

      <DetailSection
        title={t('medicines.form.safetyTitle')}
        subtitle={t('medicines.form.safetySubtitle')}
        icon={ShieldAlert}
        delay={190}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailField label={t('medicines.form.antidotes')}>
            {medicine.antidotes?.trim() ? (
              <p className="whitespace-pre-wrap">{medicine.antidotes}</p>
            ) : null}
          </DetailField>
          <DetailField label={t('medicines.form.caution')}>
            {medicine.cautionNotes?.trim() ? (
              <p className="whitespace-pre-wrap">{medicine.cautionNotes}</p>
            ) : null}
          </DetailField>
        </div>
      </DetailSection>
    </div>
  )
}
