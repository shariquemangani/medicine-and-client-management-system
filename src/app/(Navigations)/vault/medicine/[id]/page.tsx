'use client'

import { ROUTES } from '@/lib/routes'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { MedicineDetailView } from '@/components/medicines/medicine-detail-view'
import { MedicineVaultForm } from '@/components/medicines/medicine-vault-form'
import {
  formValuesToMedicineCreateInput,
  medicineToFormValues,
} from '@/lib/medicines/medicine-form'
import type { AdminBreadcrumbSegment } from '@/lib/admin-breadcrumbs'
import { getMedicine, updateMedicine } from '@/services/pharmacy-api'
import type { Medicine, MedicineFormValues } from '@/types/medicine'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/redux'
import { clearBreadcrumbOverrides, setBreadcrumbOverrides } from '@/redux/slices'
import { useMedicineFlagOptions } from '@/hooks/use-medicine-flag-options'

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
      const data = await getMedicine(id)
      const { patients: _p, subjectStaffs: _t, ...med } = data as Medicine & {
        patients?: unknown
        subjectStaffs?: unknown
      }
      setMedicine(med)
      setFormValues(medicineToFormValues(med))
    } catch {
      setNotFound(true)
      setMedicine(null)
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

  const breadcrumbSegments = useMemo((): AdminBreadcrumbSegment[] | null => {
    if (!medicine) return null
    return [
      { labelKey: 'nav.medicines', href: ROUTES.vault },
      { labelKey: 'medicines.vaultCardMedicine', href: ROUTES.vaultMedicine },
      { label: medicine.name },
    ]
  }, [medicine])

  useEffect(() => {
    if (breadcrumbSegments) {
      dispatch(setBreadcrumbOverrides(breadcrumbSegments))
    }
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
    const name = formValues.name.trim()
    if (!name) {
      toast.error('Medicine name is required')
      return
    }

    setSaving(true)
    try {
      const updated = await updateMedicine(id, formValuesToMedicineCreateInput(formValues))
      setMedicine(updated)
      setFormValues(medicineToFormValues(updated))
      setIsEditing(false)
      toast.success('Medicine updated')
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="medicine-vault-page dashboard-shell space-y-4" aria-busy="true">
        <div className="dashboard-skeleton h-52 rounded-2xl" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dashboard-skeleton h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !medicine) {
    return (
      <div className="medicine-vault-page dashboard-shell space-y-4">
        <BentoCard colSpan={12} delay={0}>
          <div className="flex flex-col items-start gap-4 p-2 sm:p-4">
            <h1 className="text-xl font-semibold text-foreground">
              {'Medicine not found'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {'This remedy may have been removed or the link is invalid.'}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.vaultMedicine}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                {'Back to medicines'}
              </Link>
            </Button>
          </div>
        </BentoCard>
      </div>
    )
  }

  return (
    <div className="medicine-vault-page dashboard-shell space-y-4">
      {isEditing && formValues ? (
        <BentoGrid>
          <BentoCard colSpan={12} delay={0} className="!p-0">
            <div className="medicine-create-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
              <div className="medicine-create-hero-mesh pointer-events-none" aria-hidden />
              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--metric-classes)/0.3)] bg-[hsl(var(--metric-classes)/0.12)] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--metric-classes))]">
                    <Sparkles className="h-3 w-3" />
                    {'Edit monograph'}
                  </div>
                  <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {medicine.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {'Refine potency ranges and clinical notes for this remedy.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="classes-hero-btn"
                    disabled={saving}
                    onClick={handleCancelEdit}
                  >
                    {'Cancel'}
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
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
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
        <MedicineDetailView medicine={medicine} onEdit={handleEdit} />
      )}
    </div>
  )
}
