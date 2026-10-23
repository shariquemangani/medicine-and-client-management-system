'use client'

import { ROUTES } from '@/lib/routes'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Activity, Sparkles } from 'lucide-react'
import { BentoGrid, PageHero, heroButtonClass, heroPrimaryClass } from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
  DiseaseDetailEditHeader,
  DiseaseDetailView,
  DiseaseVaultForm,
  DiseasesDeleteDialog,
} from '@/components/diseases'
import type { AdminBreadcrumbSegment } from '@/lib/admin-breadcrumbs'
import {
  diseaseToFormValues,
  formValuesToDiseaseCreateInput,
} from '@/lib/diseases/disease-form'
import { deleteDisease, fetchDiseaseById, updateDisease } from '@/services/disease-api'
import type { Disease, DiseaseFormValues } from '@/types/disease'
import { useDiseaseFlagOptions } from '@/hooks/use-disease-flag-options'
import { t } from '@/lib/labels'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/redux'
import { clearBreadcrumbOverrides, setBreadcrumbOverrides } from '@/redux/slices'

export default function DiseaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? ''
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth)
  const {
    symptoms: symptomOptions,
    loading: symptomOptionsLoading,
    error: symptomOptionsError,
    reload: reloadSymptomOptions,
    symptomsCategoryId,
  } = useDiseaseFlagOptions()

  const [disease, setDisease] = useState<Disease | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formValues, setFormValues] = useState<DiseaseFormValues | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const data = await fetchDiseaseById(id)
      setDisease(data)
      setFormValues(diseaseToFormValues(data))
    } catch {
      setNotFound(true)
      setDisease(null)
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
      { labelKey: 'medicines.vaultCardDiseases', href: ROUTES.vaultDiseases },
    ]
    if (disease) return [...base, { label: disease.name }]
    return [...base, { labelKey: 'diseases.detail.title' }]
  }, [disease])

  useEffect(() => {
    dispatch(setBreadcrumbOverrides(breadcrumbSegments))
  }, [breadcrumbSegments, dispatch])

  const handleEdit = () => {
    if (!disease) return
    setFormValues(diseaseToFormValues(disease))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (disease) setFormValues(diseaseToFormValues(disease))
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!formValues) return
    if (!formValues.name.trim()) {
      toast.error(t('diseases.nameRequired'))
      return
    }

    setSaving(true)
    try {
      const updated = await updateDisease(id, formValuesToDiseaseCreateInput(formValues))
      setDisease(updated)
      setFormValues(diseaseToFormValues(updated))
      setIsEditing(false)
      toast.success(t('diseases.updated'))
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('diseases.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!disease) return
    setDeleting(true)
    try {
      await deleteDisease(disease.id)
      toast.success(t('diseases.deleted'))
      router.push(ROUTES.vaultDiseases)
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('diseases.deleteFailed'))
      throw new Error('delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const dataLoading = authLoading || loading

  if (!dataLoading && (notFound || !disease)) {
    return (
      <div className="disease-vault-page dashboard-shell space-y-4">
        <PageHero
          icon={Activity}
          badge={t('diseases.vaultBadge')}
          title={t('diseases.detail.notFound')}
          subtitle={t('diseases.detail.notFoundHint')}
          back={{ href: ROUTES.vaultDiseases, label: 'Back to diseases' }}
        />
      </div>
    )
  }

  const headerName = isEditing && formValues ? formValues.name.trim() || disease?.name || '' : disease?.name ?? ''

  return (
    <div className="disease-vault-page dashboard-shell space-y-4">
      {isEditing && formValues ? (
        <BentoGrid>
          <div className="col-span-full">
            <DiseaseDetailEditHeader
              name={headerName}
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
                    onClick={() => void handleSave()}
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
            <DiseaseVaultForm
              values={formValues}
              onChange={setFormValues}
              disabled={saving}
              symptomOptions={symptomOptions}
              symptomOptionsLoading={symptomOptionsLoading}
              symptomOptionsError={symptomOptionsError}
              symptomsCategoryId={symptomsCategoryId}
              onSymptomOptionsRefresh={() => void reloadSymptomOptions()}
            />
          </div>
        </BentoGrid>
      ) : (
        <BentoGrid>
          <div className="col-span-full">
            <DiseaseDetailView
              disease={dataLoading ? null : disease}
              loading={dataLoading}
              optionsLoading={symptomOptionsLoading}
              symptomOptions={symptomOptions}
              onEdit={handleEdit}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        </BentoGrid>
      )}

      <DiseasesDeleteDialog
        target={disease ?? null}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  )
}
