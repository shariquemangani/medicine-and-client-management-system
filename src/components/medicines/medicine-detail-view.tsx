'use client'

import { ROUTES } from '@/lib/routes'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/labels'
import type { Medicine } from '@/types/medicine'
import { getMedicineSymptoms } from '@/lib/medicines/medicine-form'
import { MEDICINE_FORM_TYPES } from '@/data/prescription-options'
import {
  Activity,
  ArrowLeft,
  Beaker,
  FileText,
  FlaskConical,
  Pencil,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

function Block({
  title,
  icon: Icon,
  children,
  tone = 'default',
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  tone?: 'default' | 'mint' | 'rose' | 'amber'
}) {
  const body =
    typeof children === 'string' || typeof children === 'number'
      ? String(children).trim()
      : children
  const empty =
    body === null ||
    body === undefined ||
    (typeof body === 'string' && body.length === 0)

  return (
    <div className={`medicine-detail-block medicine-detail-block-${tone}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="medicine-detail-block-icon">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h3>
      </div>
      {empty ? (
        <p className="text-sm italic text-muted-foreground/70">{t('medicines.detail.emptyField')}</p>
      ) : typeof body === 'string' ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{body}</p>
      ) : (
        body
      )}
    </div>
  )
}

interface MedicineDetailViewProps {
  medicine: Medicine
  onEdit?: () => void
}

export function MedicineDetailView({ medicine, onEdit }: MedicineDetailViewProps) {
  const formLabel =
    MEDICINE_FORM_TYPES.find((f) => f.value === medicine.formType)?.label ??
    medicine.formType ??
    '—'
  const symptoms = getMedicineSymptoms(medicine)
  const symptomsContent =
    symptoms.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {symptoms.map((symptom) => (
          <span key={symptom} className="medicine-symptom-chip medicine-symptom-chip-readonly">
            {symptom}
          </span>
        ))}
      </div>
    ) : null

  return (
    <div className="medicine-detail-shell space-y-5">
      <div className="medicine-detail-hero">
        <div className="medicine-detail-hero-orbit" aria-hidden />
        <div className="medicine-detail-hero-grid" aria-hidden />
        <div className="relative z-10 flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <Link href={ROUTES.vaultMedicine}>
                <ArrowLeft className="h-4 w-4" />
                {t('medicines.detail.back')}
              </Link>
            </Button>
            {onEdit ? (
              <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                {t('common.edit')}
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--metric-classes)/0.25)] bg-[hsl(var(--metric-classes)/0.1)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[hsl(var(--metric-classes))] backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                {t('medicines.detail.monograph')}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {medicine.name}
                </h1>
                {medicine.commonName ? (
                  <p className="mt-1 text-base italic text-muted-foreground">
                    {medicine.commonName}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{formLabel}</Badge>
                <Badge
                  variant={
                    (medicine.status ?? '').toLowerCase() === 'archived' ||
                    (medicine.status ?? '').toLowerCase() === 'inactive'
                      ? 'secondary'
                      : 'default'
                  }
                  className="capitalize"
                >
                  {medicine.status || '—'}
                </Badge>
              </div>
              {medicine.information ? (
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {medicine.information}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="medicine-detail-stat">
                <FlaskConical className="h-4 w-4 text-[hsl(var(--metric-classes))]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t('medicines.form.potencyTitle')}
                  </p>
                  <p className="text-sm font-medium">
                    {(medicine.potencies ?? []).length || '—'}
                  </p>
                </div>
              </div>
              <div className="medicine-detail-stat">
                <Beaker className="h-4 w-4 text-[hsl(var(--metric-classes))]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t('medicines.form.formType')}
                  </p>
                  <p className="text-sm font-medium">{formLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {(medicine.potencies ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              {(medicine.potencies ?? []).map((p) => (
                <span
                  key={p}
                  className="medicine-potency-chip medicine-potency-chip-active cursor-default"
                >
                  {p}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block title={t('medicines.form.symptoms')} icon={Activity} tone="mint">
          {symptomsContent}
        </Block>
        <Block title={t('medicines.information')} icon={FileText}>
          {medicine.information}
        </Block>
        <Block title={t('medicines.form.antidotes')} icon={Beaker} tone="default">
          {medicine.antidotes}
        </Block>
        <Block title={t('medicines.form.caution')} icon={ShieldAlert} tone="amber">
          {medicine.cautionNotes}
        </Block>
      </div>
    </div>
  )
}
