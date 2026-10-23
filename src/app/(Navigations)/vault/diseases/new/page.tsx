'use client'

import { ROUTES } from '@/lib/routes'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Activity, Sparkles } from 'lucide-react'
import { BentoCard, BentoGrid, CardHeader, PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared'
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
        <div className="col-span-full">
          <PageHero
            icon={Activity}
            badge={t('diseases.createBadge')}
            title={t('diseases.addDisease')}
            subtitle={t('diseases.createSubtitle')}
            back={{ href: ROUTES.vaultDiseases, label: 'Back to diseases' }}
          />
        </div>

        <div className="col-span-full">
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
        </div>

        <BentoCard colSpan={12} accent="prescriptions" delay={220}>
          <CardHeader
            className="mb-0"
            ornament={false}
            icon={Sparkles}
            accent="prescriptions"
            title={t('diseases.form.readyToSave')}
            description={t('diseases.form.readyToSaveHint')}
            actions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className={heroButtonClass}
                  disabled={saving}
                  asChild
                >
                  <Link href={ROUTES.vaultDiseases}>{t('common.cancel')}</Link>
                </Button>
                <Button type="button" className={heroPrimaryClass} disabled={saving} onClick={handleSaveClick}>
                  {saving ? t('common.saving') : t('diseases.saveDisease')}
                </Button>
              </>
            }
          />
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
