'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/shared'
import { Form } from '@/components/ui/form'
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
import { PatientDetailHeader } from '@/components/patients/detail/clinic-detail-header'
import { PatientDetailTabs, type PatientDetailTab } from '@/components/patients/detail/patient-detail-tabs'
import { PatientDetailViewSections } from '@/components/patients/detail/patient-detail-view-sections'
import { PatientVisitHistoryPanel } from '@/components/patients/detail/patient-visit-history-panel'
import { PatientRegistrationFormSections } from '@/components/patients/patient-registration-form'
import type { CreatableMultiSelectOption } from '@/components/shared/creatable-multi-select'
import {
  clientRegistrationSchema,
  getPatientRegistrationDefaults,
  type PatientRegistrationFormValues,
} from '@/lib/patient-registration-schema'
import {
  clientToRegistrationValues,
  registrationValuesToPatientUpdate,
} from '@/lib/patients/patient-registration-mapper'
import { todayIsoDate } from '@/lib/date-select-utils'
import { getPatientDisplayName } from '@/lib/patient-display'
import type { AdminBreadcrumbSegment } from '@/lib/admin-breadcrumbs'
import { profileDetailToPatient } from '@/types/patient-profile'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/redux'
import {
  clearPatientProfile,
  fetchPatientMedicines,
  fetchPatientProfile,
  updatePatient,
  setBreadcrumbOverrides,
  clearBreadcrumbOverrides,
} from '@/redux/slices'
import { ROUTES } from '@/lib/routes'

function parseActiveTab(value: string | null): PatientDetailTab {
  return value === 'history' ? 'history' : 'overview'
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const id = params.id as string
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth)
  const { profile, loadingProfile, saving, error: profileError, profileId } = useAppSelector((s) => s.patients)

  const activeTab = parseActiveTab(searchParams.get('tab'))
  const [isEditing, setIsEditing] = useState(false)
  const [isNewVisit, setIsNewVisit] = useState(false)
  const [diseaseOptions, setDiseaseOptions] = useState<CreatableMultiSelectOption[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingValues, setPendingValues] = useState<PatientRegistrationFormValues | null>(null)

  const form = useForm<PatientRegistrationFormValues>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: getPatientRegistrationDefaults(),
  })

  const patient = profile ? profileDetailToPatient(profile) : null
  const patientName = profile?.header.displayName ?? (patient ? getPatientDisplayName(patient) : '')
  const visitCount = (patient?.visitHistory?.length ?? 0) + 1

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    dispatch(fetchPatientProfile(id))
    dispatch(fetchPatientMedicines())
    return () => {
      dispatch(clearPatientProfile())
      dispatch(clearBreadcrumbOverrides())
    }
  }, [authLoading, isAuthenticated, dispatch, id])

  const breadcrumbSegments = useMemo((): AdminBreadcrumbSegment[] | null => {
    if (!profile) return null

    const segments: AdminBreadcrumbSegment[] = [
      { labelKey: 'nav.patients', href: ROUTES.patients },
      { label: patientName, href: `${ROUTES.patient(id)}?tab=overview` },
    ]

    if (isEditing) {
      segments.push({ label: isNewVisit ? 'New visit' : 'Edit' })
    } else if (activeTab === 'history') {
      segments.push({ label: 'Visit history' })
    }

    return segments
  }, [profile, patientName, id, isEditing, isNewVisit, activeTab])

  useEffect(() => {
    if (breadcrumbSegments) {
      dispatch(setBreadcrumbOverrides(breadcrumbSegments))
    }
  }, [breadcrumbSegments, dispatch])

  const handleDiseaseOptionsChange = useCallback((options: CreatableMultiSelectOption[]) => {
    setDiseaseOptions(options)
  }, [])

  const resetFormFromPatient = useCallback(() => {
    if (!profile) return
    form.reset(clientToRegistrationValues(profileDetailToPatient(profile)))
  }, [profile, form])

  const setActiveTab = (tab: PatientDetailTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/patients/${id}?${params.toString()}`, { scroll: false })
  }

  const handleEdit = () => {
    if (!patient) return
    resetFormFromPatient()
    setIsNewVisit(false)
    setIsEditing(true)
    setActiveTab('overview')
  }

  const handleNewVisit = () => {
    if (!patient) return
    const base = clientToRegistrationValues(patient)
    form.reset({
      ...base,
      visitDate: todayIsoDate(),
    })
    setIsNewVisit(true)
    setIsEditing(true)
    setActiveTab('overview')
  }

  const handleCancel = () => {
    resetFormFromPatient()
    setIsNewVisit(false)
    setIsEditing(false)
  }

  const persistUpdate = async (values: PatientRegistrationFormValues) => {
    if (!patient) return
    try {
      const data = registrationValuesToPatientUpdate(values, diseaseOptions, {
        appendVisitFrom: isNewVisit ? patient : null,
      })
      await dispatch(updatePatient({ id, data })).unwrap()
      toast.success(isNewVisit ? 'New visit recorded' : 'Patient updated')
      setIsEditing(false)
      setIsNewVisit(false)
      if (isNewVisit) {
        setActiveTab('history')
      }
    } catch {
      toast.error('Failed to save patient')
    }
  }

  const handleSaveClick = () => {
    form.handleSubmit((values) => {
      setPendingValues(values)
      setConfirmOpen(true)
    })()
  }

  const handleConfirmSave = async () => {
    if (!pendingValues) return
    await persistUpdate(pendingValues)
    setConfirmOpen(false)
    setPendingValues(null)
  }

  const notFound = !authLoading && !loadingProfile && !profile && !!profileError && profileId === id
  const loading = !notFound && (authLoading || loadingProfile || !profile)

  if (notFound) {
    return (
      <div className="dashboard-shell flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-semibold text-foreground">Patient not found</p>
        <p className="text-sm text-muted-foreground">
          This record may have been removed or the link is invalid.
        </p>
        <Button asChild variant="outline">
          <Link href={ROUTES.patients}>Back to patients</Link>
        </Button>
      </div>
    )
  }

  const confirmPatientName = pendingValues?.patientName.trim() || patient?.firstName || ''

  return (
    <div className="dashboard-shell space-y-4">
      <BentoGrid>
        <PatientDetailHeader
          patient={loading ? null : patient}
          isEditing={isEditing}
          isNewVisit={isNewVisit}
          saving={saving}
          onBack={() => router.push(ROUTES.patients)}
          onEdit={handleEdit}
          onNewVisit={handleNewVisit}
          onSave={handleSaveClick}
          onCancel={handleCancel}
        />

        {!isEditing ? (
          <div className="col-span-full">
            <PatientDetailTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              historyCount={loading ? 0 : visitCount}
              disabled={loading}
            />
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="contents">
            {isEditing && patient ? (
              <>
                <PatientRegistrationFormSections
                  form={form}
                  onDiseaseOptionsChange={handleDiseaseOptionsChange}
                />
                <BentoCard colSpan={12} accent="patients" delay={420}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {isNewVisit ? 'Record new visit' : 'Save changes'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isNewVisit
                          ? 'The current visit will be archived to history before saving this consultation.'
                          : 'Update patient details, medicines, diet, and fees for the current visit.'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        className="clinic-hero-primary sm:min-w-[10rem]"
                        disabled={saving}
                        onClick={handleSaveClick}
                      >
                        {saving ? (
                          <>
                            Saving...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-1.5 h-4 w-4" />
                            {isNewVisit ? 'Save visit' : 'Save changes'}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="clinic-hero-btn sm:min-w-[10rem]"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </BentoCard>
              </>
            ) : activeTab === 'overview' || !patient ? (
              <PatientDetailViewSections patient={loading ? null : patient} />
            ) : (
              <PatientVisitHistoryPanel patient={patient} currentVisitDate={patient.admissionDate} />
            )}
          </form>
        </Form>
      </BentoGrid>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="clinic-form-dialog max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isNewVisit ? 'Record new visit?' : 'Save patient changes?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isNewVisit ? (
                <>
                  This will archive the current consultation for{' '}
                  <span className="font-medium text-foreground">{confirmPatientName}</span> and save
                  the new visit details.
                </>
              ) : (
                <>
                  This will update the patient record for{' '}
                  <span className="font-medium text-foreground">{confirmPatientName}</span>.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="clinic-hero-primary"
              disabled={saving}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmSave()
              }}
            >
              {saving ? 'Saving...' : 'Confirm & save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
