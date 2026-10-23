'use client'

import { ROUTES } from '@/lib/routes'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { BookOpen, Sparkles } from 'lucide-react'
import { BentoGrid, PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
  MedicineDetailHeader,
  MedicineDetailView,
} from '@/components/medicines/medicine-detail-view'
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
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? ''
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
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('medicines.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const dataLoading = authLoading || loading

  if (!dataLoading && (notFound || !medicine)) {
    return (
      <div className="medicine-vault-page dashboard-shell space-y-4">
        <PageHero
          icon={BookOpen}
          badge={t('medicines.vaultBadge')}
          title={t('medicines.detail.notFound')}
          subtitle={t('medicines.detail.notFoundHint')}
          back={{ href: ROUTES.vaultMedicine, label: 'Back to medicines' }}
        />
      </div>
    )
  }

  const headerName =
    isEditing && formValues ? formValues.name.trim() || medicine?.name : medicine?.name
  const headerCommonName =
    isEditing && formValues ? formValues.commonName.trim() : medicine?.commonName

  return (
    <div className="medicine-vault-page dashboard-shell space-y-4">
      {isEditing && formValues ? (
        <BentoGrid>
          <div className="col-span-full">
            <MedicineDetailHeader
              name={headerName}
              commonName={headerCommonName}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={heroButtonClass}
                    disabled={saving}
                    onClick={handleCancelEdit}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={`${heroPrimaryClass} gap-1.5`}
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {!saving && (
                      <Sparkles className="h-3.5 w-3.5" />
)}
                    {saving ? t('common.saving') : t('common.save')}
                  </Button>
                </div>
              }
            />
          </div>
          <div className="col-span-full">
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
          </div>
        </BentoGrid>
      ) : (
        <BentoGrid>
          <div className="col-span-full">
            <MedicineDetailView
              medicine={dataLoading ? null : medicine}
              loading={dataLoading}
              optionsLoading={flagOptionsLoading}
              flagOptions={flagOptions}
              onEdit={handleEdit}
            />
          </div>
        </BentoGrid>
      )}
    </div>
  )
}
