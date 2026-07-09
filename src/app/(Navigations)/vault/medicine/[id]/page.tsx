'use client'

import { ROUTES } from '@/lib/routes'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
  MedicineDetailHeader,
  MedicineDetailView,
} from '@/components/medicines/medicine-detail-view'
import { MedicineDetailSkeleton } from '@/components/medicines/detail/medicine-detail-skeleton'
import { MedicineVaultForm } from '@/components/medicines/medicine-vault-form'
import {
  formValuesToMedicineCreateInput,
  medicineToFormValues,
} from '@/lib/medicines/medicine-form'
import type { AdminBreadcrumbSegment } from '@/lib/admin-breadcrumbs'
import { fetchMedicineById } from '@/services/medicine-api'
import { updateMedicine } from '@/services/pharmacy-api'
import type { Medicine, MedicineFormValues } from '@/types/medicine'
import { useMedicineFlagOptions } from '@/hooks/use-medicine-flag-options'
import { t } from '@/lib/labels'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/redux'
import { clearBreadcrumbOverrides, setBreadcrumbOverrides } from '@/redux/slices'

export default function MedicineDetailPage() {
  const params = useParams()
  const dispatch = useAppDispatch()
  const id = params.id as string
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth)
  const {
    options: flagOptions,
    loading: flagOptionsLoading,
    error: flagOptionsError,
    reload: reloadFlagOptions,
    symptomsCategoryId,
  } = useMedicineFlagOptions()

  const [medicine, setMedicine] = useState<Medicine | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formValues, setFormValues] = useState<MedicineFormValues | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const data = await fetchMedicineById(id)
      setMedicine(data)
      setFormValues(medicineToFormValues(data))
    } catch {
      setNotFound(true)
      setMedicine(null)
      setFormValues(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    void load()
    return () => {
      dispatch(clearBreadcrumbOverrides())
    }
  }, [authLoading, isAuthenticated, load, dispatch])

  const breadcrumbSegments = useMemo((): AdminBreadcrumbSegment[] => {
    const base: AdminBreadcrumbSegment[] = [
      { labelKey: 'nav.medicines' },
      { labelKey: 'medicines.vaultCardMedicine', href: ROUTES.vaultMedicine },
    ]
    if (medicine) return [...base, { label: medicine.name }]
    return [...base, { labelKey: 'medicines.detail.title' }]
  }, [medicine])

  useEffect(() => {
    dispatch(setBreadcrumbOverrides(breadcrumbSegments))
  }, [breadcrumbSegments, dispatch])

  const handleEdit = () => {
    if (!medicine) return
    setFormValues(medicineToFormValues(medicine))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (medicine) setFormValues(medicineToFormValues(medicine))
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!formValues) return
    if (!formValues.name.trim()) {
      toast.error(t('medicines.form.nameRequired'))
      return
    }

    setSaving(true)
    try {
      const updated = await updateMedicine(id, formValuesToMedicineCreateInput(formValues))
      setMedicine(updated)
      setFormValues(medicineToFormValues(updated))
      setIsEditing(false)
      toast.success(t('medicines.updated'))
    } catch {
      toast.error(t('medicines.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return <MedicineDetailSkeleton />
  }

  if (notFound || !medicine) {
    return (
      <div className="medicine-vault-page dashboard-shell space-y-4">
        <BentoCard colSpan={12} delay={0}>
          <div className="flex flex-col items-start gap-4 p-2 sm:p-4">
            <h1 className="text-xl font-semibold text-foreground">
              {t('medicines.detail.notFound')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('medicines.detail.notFoundHint')}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.vaultMedicine}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                {t('medicines.detail.back')}
              </Link>
            </Button>
          </div>
        </BentoCard>
      </div>
    )
  }

  const headerName = isEditing && formValues ? formValues.name.trim() || medicine.name : medicine.name
  const headerCommonName =
    isEditing && formValues ? formValues.commonName.trim() : medicine.commonName

  return (
    <div className="medicine-vault-page dashboard-shell space-y-4">
      {isEditing && formValues ? (
        <BentoGrid>
          <BentoCard colSpan={12} delay={0} className="!p-0">
            <MedicineDetailHeader
              name={headerName}
              commonName={headerCommonName}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="classes-hero-btn"
                    disabled={saving}
                    onClick={handleCancelEdit}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="classes-hero-primary gap-1.5"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {saving ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              }
            />
          </BentoCard>
          <BentoCard colSpan={12} delay={80} className="!bg-transparent !border-0 !shadow-none !p-0">
            <MedicineVaultForm
              values={formValues}
              onChange={setFormValues}
              disabled={saving}
              flagOptions={flagOptions}
              flagOptionsLoading={flagOptionsLoading}
              flagOptionsError={flagOptionsError}
              symptomsCategoryId={symptomsCategoryId}
              onFlagOptionsRefresh={() => void reloadFlagOptions()}
            />
          </BentoCard>
        </BentoGrid>
      ) : (
        <BentoGrid>
          <BentoCard colSpan={12} delay={0} className="!bg-transparent !border-0 !shadow-none !p-0">
            <MedicineDetailView
              medicine={medicine}
              flagOptions={flagOptions}
              onEdit={handleEdit}
            />
          </BentoCard>
        </BentoGrid>
      )}
    </div>
  )
}
