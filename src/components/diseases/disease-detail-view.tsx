'use client'

import { SectionCard as KitSectionCard, SectionCardHeader } from '@/components/shared/section-card'
import { ROUTES } from '@/lib/routes'

import Link from 'next/link'
import { Activity, ArrowLeft, FileText, HeartPulse, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiseaseSymptomBadges } from '@/components/diseases/disease-symptom-badges'
import type { MedicineFlagOption } from '@/data/medicine-flag-fields'
import { t } from '@/lib/labels'
import type { Disease } from '@/types/disease'
import { cn } from '@/lib/utils'
import { Skel, SkelChips } from '@/components/medicines/skeleton-bits'

function DetailSection({
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

function DetailField({
  label,
  children,
  className,
  loading,
  skeleton,
}: {
  label: string
  children?: React.ReactNode
  className?: string
  loading?: boolean
  skeleton?: React.ReactNode
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
      {loading ? (
        <div aria-busy="true">{skeleton ?? <Skel className="h-5 w-40" />}</div>
      ) : empty ? (
        <p className="text-sm italic text-muted-foreground/70">{t('diseases.detail.emptyField')}</p>
      ) : (
        <div className="text-sm text-foreground">{children}</div>
      )}
    </div>
  )
}

interface DiseaseDetailViewProps {
  disease?: Disease | null
  loading?: boolean
  optionsLoading?: boolean
  symptomOptions?: Pick<MedicineFlagOption, 'value' | 'label'>[]
  onEdit?: () => void
  onDelete?: () => void
}

export function DiseaseDetailView({
  disease: diseaseProp,
  loading,
  optionsLoading,
  symptomOptions = [],
  onEdit,
  onDelete,
}: DiseaseDetailViewProps) {
  const disease = (diseaseProp ?? {}) as Disease
  const dataLoading = !!loading || !diseaseProp
  const symptomsPending = dataLoading || !!optionsLoading
  return (
    <div className="space-y-4">
      <div className="disease-create-hero relative overflow-hidden rounded-2xl border p-4 sm:p-5">
        <div className="disease-create-hero-mesh pointer-events-none" aria-hidden />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="diseases-hero-btn shrink-0"
              asChild
            >
              <Link href={ROUTES.vaultDiseases} aria-label={t('diseases.detail.back')}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="diseases-avatar flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="diseases-hero-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
                {t('diseases.vaultBadge')}
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {dataLoading ? (
                  <>
                    <span className="sr-only">{t('diseases.detail.title')}</span>
                    <Skel className="h-7 w-56" />
                  </>
                ) : (
                  disease.name
                )}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onEdit && !dataLoading ? (
              <Button type="button" variant="outline" size="sm" className="diseases-hero-btn" onClick={onEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {t('common.edit')}
              </Button>
            ) : null}
            {onDelete && !dataLoading ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="clinic-table-action-delete"
                onClick={onDelete}
              >
                {t('common.delete')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <DetailSection
        title={t('diseases.form.symptomsTitle')}
        subtitle={t('diseases.form.symptomsSubtitle')}
        icon={Activity}
        delay={40}
      >
        <DetailField label={t('diseases.form.symptoms')} loading={symptomsPending} skeleton={<SkelChips count={4} />}>
          <DiseaseSymptomBadges symptoms={disease.symptoms} symptomOptions={symptomOptions} />
        </DetailField>
      </DetailSection>

      <DetailSection
        title={t('diseases.form.careTitle')}
        subtitle={t('diseases.form.careSubtitle')}
        icon={HeartPulse}
        delay={90}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DetailField label={t('diseases.form.cure')} loading={dataLoading} skeleton={<div className="space-y-2"><Skel className="h-4 w-full" /><Skel className="h-4 w-2/3" /></div>}>
            {disease.cure?.trim() ? (
              <p className="whitespace-pre-wrap text-muted-foreground">{disease.cure}</p>
            ) : null}
          </DetailField>
          <DetailField label={t('diseases.form.diet')} loading={dataLoading} skeleton={<div className="space-y-2"><Skel className="h-4 w-full" /><Skel className="h-4 w-2/3" /></div>}>
            {disease.diet?.trim() ? (
              <p className="whitespace-pre-wrap text-muted-foreground">{disease.diet}</p>
            ) : null}
          </DetailField>
          <DetailField label={t('diseases.form.precautions')} loading={dataLoading} skeleton={<div className="space-y-2"><Skel className="h-4 w-full" /><Skel className="h-4 w-2/3" /></div>}>
            {disease.precautions?.trim() ? (
              <p className="whitespace-pre-wrap text-muted-foreground">{disease.precautions}</p>
            ) : null}
          </DetailField>
        </div>
      </DetailSection>
    </div>
  )
}

export function DiseaseDetailEditHeader({
  name,
  actions,
}: {
  name: string
  actions: React.ReactNode
}) {
  return (
    <div className="disease-create-hero relative overflow-hidden rounded-2xl border p-4 sm:p-5">
      <div className="disease-create-hero-mesh pointer-events-none" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="diseases-hero-btn shrink-0"
            asChild
          >
            <Link href={ROUTES.vaultDiseases} aria-label={t('diseases.detail.back')}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="diseases-hero-badge mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium">
              <FileText className="h-3 w-3" />
              {t('diseases.form.editBadge')}
            </div>
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('diseases.form.editSubtitle')}</p>
          </div>
        </div>
        {actions}
      </div>
    </div>
  )
}
