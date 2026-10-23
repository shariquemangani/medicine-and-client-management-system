'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/routes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GraduationCap, UserPlus } from 'lucide-react'
import { BentoCard, BentoGrid } from '@/components/shared'
import { PageHero } from '@/components/shared/page-hero'
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
        <div className="col-span-full">
          <PageHero
            icon={GraduationCap}
            badge="New enrollment"
            title="Create Patient"
            subtitle="Fill in the enrollment form with patient, school, and parent details from the registry."
            back={{ href: ROUTES.patients, label: 'Back to patients' }}
          />
        </div>

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
