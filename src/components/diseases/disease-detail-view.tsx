'use client'

import { SectionCard as KitSectionCard, SectionCardHeader } from '@/components/shared/section-card'
import { PageHero, heroButtonClass } from '@/components/shared/page-hero'
import { ROUTES } from '@/lib/routes'

import { Activity, FileText, HeartPulse, Pencil } from 'lucide-react'
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
        accent="prescriptions"
      />
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
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
      <PageHero
        icon={Activity}
        badge={t('diseases.vaultBadge')}
        title={
          dataLoading ? (
            <>
              <span className="sr-only">{t('diseases.detail.title')}</span>
              <Skel className="h-6 w-48" />
            </>
          ) : (
            disease.name
          )
        }
        back={{ href: ROUTES.vaultDiseases, label: 'Back to diseases' }}
        actions={
          <>
            {onEdit && !dataLoading ? (
              <Button type="button" variant="outline" size="sm" className={heroButtonClass} onClick={onEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {t('common.edit')}
              </Button>
            ) : null}
            {onDelete && !dataLoading ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="clinic-table-action-delete h-8 rounded-xl px-3 text-xs"
                onClick={onDelete}
              >
                {t('common.delete')}
              </Button>
            ) : null}
          </>
        }
      />

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
    <PageHero
      icon={FileText}
      badge={t('diseases.form.editBadge')}
      title={name}
      subtitle={t('diseases.form.editSubtitle')}
      back={{ href: ROUTES.vaultDiseases, label: 'Back to diseases' }}
      actions={actions}
    />
  )
}
