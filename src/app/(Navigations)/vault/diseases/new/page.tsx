'use client'

import { ROUTES } from '@/lib/routes'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Activity, ArrowLeft, Sparkles } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DiseaseVaultForm } from '@/components/diseases/disease-vault-form'
import {
  emptyDiseaseFormValues,
  formValuesToDiseaseCreateInput,
} from '@/lib/diseases/disease-form'
import { createDisease } from '@/services/disease-api'
import type { DiseaseFormValues } from '@/types/disease'
import { useDiseaseFlagOptions } from '@/hooks/use-disease-flag-options'
import { t } from '@/lib/labels'
import { toast } from 'sonner'

export default function NewDiseasePage() {
  const router = useRouter()
  const [values, setValues] = useState<DiseaseFormValues>(emptyDiseaseFormValues())
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const {
    symptoms: symptomOptions,
    loading: symptomOptionsLoading,
    error: symptomOptionsError,
    reload: reloadSymptomOptions,
    symptomsCategoryId,
  } = useDiseaseFlagOptions()

  const handleSaveClick = () => {
    if (!values.name.trim()) {
      toast.error(t('diseases.nameRequired'))
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    setSaving(true)
    try {
      const payload = formValuesToDiseaseCreateInput(values)
      const disease = await createDisease(payload)
      toast.success(t('diseases.created'))
      router.replace(ROUTES.vaultDiseaseDetail(disease.id))
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('diseases.createFailed'))
      setSaving(false)
    }
  }

  const confirmDiseaseName = values.name.trim() || 'Disease'

  return (
    <div className="disease-vault-page dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <div className="disease-create-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
            <div className="disease-create-hero-mesh pointer-events-none" aria-hidden />
            <div className="disease-create-hero-scan" aria-hidden />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
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
                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {t('diseases.addDisease')}
                  </h1>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    {t('diseases.createSubtitle')}
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 self-center rounded-full border border-[hsl(var(--metric-exams)/0.3)] bg-[hsl(var(--metric-exams)/0.12)] px-2.5 py-1 text-[12px] font-medium text-[hsl(var(--metric-exams))] sm:inline-flex">
                <Activity className="h-3 w-3" />
                {t('diseases.createBadge')}
              </div>
            </div>
          </div>
        </BentoCard>

        <BentoCard colSpan={12} delay={80} className="!bg-transparent !border-0 !shadow-none !p-0">
          <DiseaseVaultForm
            values={values}
            onChange={setValues}
            disabled={saving}
            symptomOptions={symptomOptions}
            symptomOptionsLoading={symptomOptionsLoading}
            symptomOptionsError={symptomOptionsError}
            symptomsCategoryId={symptomsCategoryId}
            onSymptomOptionsRefresh={() => void reloadSymptomOptions()}
          />
        </BentoCard>

        <BentoCard colSpan={12} accent="prescriptions" delay={220}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('diseases.form.readyToSave')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('diseases.form.readyToSaveHint')}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="diseases-hero-primary sm:min-w-[10rem]"
                disabled={saving}
                onClick={handleSaveClick}
              >
                {saving ? (
                  <>
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    {t('diseases.saveDisease')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="diseases-hero-btn sm:min-w-[10rem]"
                disabled={saving}
                asChild
              >
                <Link href={ROUTES.vaultDiseases}>{t('common.cancel')}</Link>
              </Button>
            </div>
          </div>
        </BentoCard>
      </BentoGrid>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="clinic-form-dialog max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('diseases.form.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('diseases.form.confirmDescription', { name: confirmDiseaseName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="diseases-hero-primary"
              disabled={saving}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmSave()
              }}
            >
              {saving ? t('common.saving') : t('diseases.form.confirmSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
