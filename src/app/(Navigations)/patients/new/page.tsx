'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/shared'
import { PageHero } from '@/components/shared/page-hero'
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
import { PatientRegistrationFormSections } from '@/components/patients/patient-registration-form'
import type { CreatableMultiSelectOption } from '@/components/shared/creatable-multi-select'
import {
  clientRegistrationSchema,
  getPatientRegistrationDefaults,
  registrationToPatientCreateInput,
  type PatientRegistrationFormValues,
} from '@/lib/patient-registration-schema'
import { useAppDispatch, useAppSelector } from '@/redux'
import { createPatient } from '@/redux/slices'
import { ROUTES } from '@/lib/routes'
import { toast } from 'sonner'

export default function NewPatientPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { creating } = useAppSelector((s) => s.patients)
  const [diseaseOptions, setDiseaseOptions] = useState<CreatableMultiSelectOption[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingValues, setPendingValues] = useState<PatientRegistrationFormValues | null>(null)

  const form = useForm<PatientRegistrationFormValues>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: getPatientRegistrationDefaults(),
  })

  const handleDiseaseOptionsChange = useCallback((options: CreatableMultiSelectOption[]) => {
    setDiseaseOptions(options)
  }, [])

  const savePatient = async (values: PatientRegistrationFormValues) => {
    try {
      const payload = registrationToPatientCreateInput(values, diseaseOptions)
      const patient = await dispatch(createPatient(payload)).unwrap()
      toast.success('Patient registered')
      router.push(ROUTES.patient(patient.id))
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
    await savePatient(pendingValues)
    setConfirmOpen(false)
    setPendingValues(null)
  }

  const confirmPatientName = pendingValues?.patientName.trim() || 'Patient'

  return (
    <div className="dashboard-shell space-y-4">
      <BentoGrid>
        <div className="col-span-full">
          <PageHero
            icon={UserPlus}
            badge="Patient registration"
            title="New Patient Visit"
            subtitle="Record consultation details, prescribed medicines, diet plan, notes, and visit fees."
            back={{ href: ROUTES.patients, label: 'Back to patients' }}
          />
        </div>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="contents">
            <PatientRegistrationFormSections
              form={form}
              onDiseaseOptionsChange={handleDiseaseOptionsChange}
            />

            <BentoCard colSpan={12} accent="patients" delay={420}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Ready to save</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Required: date, name, disease, and medicine name. Other fields are optional.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    className="clinic-hero-primary sm:min-w-[10rem]"
                    disabled={creating}
                    onClick={handleSaveClick}
                  >
                    {creating ? (
                      <>
                        Saving...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-1.5 h-4 w-4" />
                        Save Patient
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="clinic-hero-btn sm:min-w-[10rem]"
                    asChild
                  >
                    <Link href={ROUTES.patients}>Cancel</Link>
                  </Button>
                </div>
              </div>
            </BentoCard>
          </form>
        </Form>
      </BentoGrid>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="clinic-form-dialog max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Save patient record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new patient record for{' '}
              <span className="font-medium text-foreground">{confirmPatientName}</span>. You can
              edit the record later from the patient profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="clinic-hero-primary"
              disabled={creating}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmSave()
              }}
            >
              {creating ? 'Saving...' : 'Confirm & save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
