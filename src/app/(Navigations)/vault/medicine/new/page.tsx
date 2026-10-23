'use client'

import { ROUTES } from '@/lib/routes'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, Sparkles } from 'lucide-react'
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
        <div className="col-span-full">
          <PageHero
            icon={BookOpen}
            badge={t('medicines.form.createBadge')}
            title={t('medicines.addMedicine')}
            subtitle={t('medicines.form.createSubtitle')}
            back={{ href: ROUTES.vaultMedicine, label: 'Back to medicines' }}
          />
        </div>

        <div className="col-span-full">
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
        </div>

        <BentoCard colSpan={12} accent="medicines" delay={220}>
          <CardHeader
            className="mb-0"
            ornament={false}
            icon={Sparkles}
            accent="medicines"
            title={t('medicines.form.readyToSave')}
            description={t('medicines.form.readyToSaveHint')}
            actions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className={heroButtonClass}
                  disabled={saving}
                  asChild
                >
                  <Link href={ROUTES.vaultMedicine}>{t('common.cancel')}</Link>
                </Button>
                <Button type="button" className={heroPrimaryClass} disabled={saving} onClick={handleSaveClick}>
                  {saving ? t('common.saving') : t('medicines.form.saveMedicine')}
                </Button>
              </>
            }
          />
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
