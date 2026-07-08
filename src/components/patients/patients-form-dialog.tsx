'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GraduationCap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import type { Patient, PatientCreateInput } from '@/types'
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

const academicClassOptions = DEFAULT_MEDICINE_CATEGORIES.map((level) => ({
  id: level.id,
  name: level.name,
  labelKey: level.labelKey,
}))

export type { PatientFormValues } from '@/lib/patient-form-schema'

interface PatientsFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Patient | null
  onSubmit: (payload: PatientCreateInput) => Promise<void>
}

export function PatientsFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
}: PatientsFormDialogProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: getPatientFormDefaults(null),
  })

  useEffect(() => {
    if (open) {
      form.reset(getPatientFormDefaults(editing))
    }
  }, [open, editing, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clinic-form-dialog max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="dialog-icon-badge dialog-icon-badge-patients mb-2">
            <GraduationCap className="h-5 w-5" />
          </div>
          <DialogTitle>{editing ? 'Edit Patient' : 'Create Patient'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update enrollment details, contact info, and guardian records.' : 'Add a new patient to the registry with class and guardian details.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit(patientFormValuesToPayload(values))
              onOpenChange(false)
            })}
            className="space-y-5"
          >
            <PatientIdentitySection form={form} classes={academicClassOptions} />
            <PatientMadrasaSection form={form} classes={academicClassOptions} />
            <PatientAcademicSection form={form} classes={academicClassOptions} />
            <PatientGuardianSection form={form} classes={academicClassOptions} />
            <PatientNotesSection form={form} classes={academicClassOptions} />
            <Button type="submit" className="dialog-btn-primary w-full">
              {editing ? 'Edit Patient' : 'Save Patient'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
