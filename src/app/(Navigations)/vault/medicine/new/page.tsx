'use client'

import { ROUTES } from '@/lib/routes'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, FlaskConical, Sparkles } from 'lucide-react'
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
import { MedicineVaultForm } from '@/components/medicines/medicine-vault-form'
import {
  emptyMedicineFormValues,
  formValuesToMedicineCreateInput,
} from '@/lib/medicines/medicine-form'
import { createMedicine } from '@/services/pharmacy-api'
import type { MedicineFormValues } from '@/types/medicine'
import { useMedicineFlagOptions } from '@/hooks/use-medicine-flag-options'
import { t } from '@/lib/labels'
import { toast } from 'sonner'

export default function NewMedicinePage() {
  const router = useRouter()
  const [values, setValues] = useState<MedicineFormValues>(emptyMedicineFormValues)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const {
    options: flagOptions,
    loading: flagOptionsLoading,
    error: flagOptionsError,
    reload: reloadFlagOptions,
    symptomsCategoryId,
  } = useMedicineFlagOptions()

  const handleSaveClick = () => {
    if (!values.name.trim()) {
      toast.error(t('medicines.form.nameRequired'))
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    setSaving(true)
    try {
      const payload = formValuesToMedicineCreateInput(values)
      const medicine = await createMedicine(payload)
      toast.success(t('medicines.created'))
      setConfirmOpen(false)
      router.push(ROUTES.vaultMedicineDetail(medicine.id))
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('medicines.createFailed'))
    } finally {
      setSaving(false)
    }
  }

  const confirmMedicineName = values.name.trim() || 'Medicine'

  return (
    <div className="medicine-vault-page dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <div className="medicine-create-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
            <div className="medicine-create-hero-mesh pointer-events-none" aria-hidden />
            <div className="medicine-create-hero-scan" aria-hidden />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="classes-hero-btn shrink-0"
                  asChild
                >
                  <Link href={ROUTES.vaultMedicine} aria-label={t('medicines.detail.back')}>
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {t('medicines.addMedicine')}
                  </h1>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    {t('medicines.form.createSubtitle')}
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 self-center rounded-full border border-[hsl(var(--metric-classes)/0.3)] bg-[hsl(var(--metric-classes)/0.12)] px-2.5 py-1 text-[12px] font-medium text-[hsl(var(--metric-classes))] sm:inline-flex">
                <FlaskConical className="h-3 w-3" />
                {t('medicines.form.createBadge')}
              </div>
            </div>
          </div>
        </BentoCard>

        <BentoCard colSpan={12} delay={80} className="!bg-transparent !border-0 !shadow-none !p-0">
          <MedicineVaultForm
            values={values}
            onChange={setValues}
            disabled={saving}
            flagOptions={flagOptions}
            flagOptionsLoading={flagOptionsLoading}
            flagOptionsError={flagOptionsError}
            symptomsCategoryId={symptomsCategoryId}
            onFlagOptionsRefresh={() => void reloadFlagOptions()}
          />
        </BentoCard>

        <BentoCard colSpan={12} accent="medicines" delay={220}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('medicines.form.readyToSave')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('medicines.form.readyToSaveHint')}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="classes-hero-primary sm:min-w-[10rem]"
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
                    {t('medicines.form.saveMedicine')}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="classes-hero-btn sm:min-w-[10rem]"
                disabled={saving}
                asChild
              >
                <Link href={ROUTES.vaultMedicine}>{t('common.cancel')}</Link>
              </Button>
            </div>
          </div>
        </BentoCard>
      </BentoGrid>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="clinic-form-dialog max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('medicines.form.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('medicines.form.confirmDescription', { name: confirmMedicineName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="classes-hero-primary"
              disabled={saving}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmSave()
              }}
            >
              {saving ? t('common.saving') : t('medicines.form.confirmSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
