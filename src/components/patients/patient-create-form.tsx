'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/routes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, GraduationCap, UserPlus } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/shared'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  PatientIdentitySection,
  PatientMadrasaSection,
  PatientAcademicSection,
  PatientGuardianSection,
  PatientNotesSection,
} from '@/components/patients/patient-form-fields'
import {
  getPatientFormDefaults,
  patientFormSchema,
  patientFormValuesToPayload,
  type PatientFormValues,
} from '@/lib/patient-form-schema'
import { DEFAULT_MEDICINE_CATEGORIES } from '@/data/medicine-categories'
import { useAppDispatch, useAppSelector } from '@/redux'
import { createPatient } from '@/redux/slices'
import { toast } from 'sonner'

const academicClassOptions = DEFAULT_MEDICINE_CATEGORIES.map((level) => ({
  id: level.id,
  name: level.name,
  labelKey: level.labelKey,
}))

export function PatientCreateForm() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { creating } = useAppSelector((s) => s.patients)
  const { isLoading: authLoading } = useAppSelector((s) => s.auth)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: getPatientFormDefaults(null),
  })

  const onSubmit = async (values: PatientFormValues) => {
    try {
      const patient = await dispatch(createPatient(patientFormValuesToPayload(values))).unwrap()
      toast.success('Patient created')
      router.push(ROUTES.patient(patient.id))
    } catch {
      toast.error('Failed to save patient')
    }
  }

  if (authLoading) {
    return (
      <div className="dashboard-shell space-y-4" aria-busy="true">
        <div className="dashboard-skeleton h-28 rounded-2xl" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dashboard-skeleton h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <div className="clinic-create-hero relative -m-4 overflow-hidden rounded-[calc(1rem-1px)] p-4 sm:-m-5 sm:p-5">
            <div className="clinic-hero-mesh pointer-events-none" aria-hidden />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="clinic-hero-btn shrink-0"
                  asChild
                >
                  <Link href={ROUTES.patients} aria-label={'Back to patients'}>
                    <ChevronLeft className="h-5 w-5" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {'Create Patient'}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {'Fill in the enrollment form with patient, school, and parent details from the registry.'}
                  </p>
                </div>
              </div>
              <div className="clinic-hero-badge flex shrink-0 items-center gap-1.5 self-center rounded-full px-2.5 py-1 text-[12px] font-medium">
                <GraduationCap className="h-3 w-3" />
                {'New enrollment'}
              </div>
            </div>
          </div>
        </BentoCard>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
            <BentoCard colSpan={6} accent="patients" delay={60}>
              <PatientIdentitySection form={form} classes={academicClassOptions} />
            </BentoCard>

            <BentoCard colSpan={6} accent="inventory" delay={120}>
              <PatientMadrasaSection form={form} classes={academicClassOptions} />
            </BentoCard>

            <BentoCard colSpan={6} accent="medicines" delay={180}>
              <PatientAcademicSection form={form} classes={academicClassOptions} />
            </BentoCard>

            <BentoCard colSpan={6} accent="staff" delay={240}>
              <PatientGuardianSection form={form} classes={academicClassOptions} />
            </BentoCard>

            <BentoCard colSpan={12} accent="prescriptions" delay={300}>
              <PatientNotesSection form={form} classes={academicClassOptions} />
            </BentoCard>

            <BentoCard colSpan={12} accent="patients" delay={360}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{'Ready to enroll'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{'All required fields must be filled before enrollment is saved.'}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="submit" className="clinic-hero-primary sm:min-w-[10rem]" disabled={creating}>
                    {creating ? (
                      <>
                        {'Saving...'}
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-1.5 h-4 w-4" />
                        {'Save Patient'}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" className="clinic-hero-btn sm:min-w-[10rem]" asChild>
                    <Link href={ROUTES.patients}>{'Cancel'}</Link>
                  </Button>
                </div>
              </div>
            </BentoCard>
          </form>
        </Form>
      </BentoGrid>
    </div>
  )
}
