'use client'

import { useEffect, useState } from 'react'
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import {
  CalendarDays,
  ClipboardList,
  Leaf,
  Pill,
  Plus,
  Stethoscope,
  Trash2,
  UserRound,
} from 'lucide-react'
import { BentoCard } from '@/components/shared'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PatientFormSectionHeader } from '@/components/patients/patient-form-section-header'
import { PrescriptionMedicineRow } from '@/components/patients/prescription-medicine-row'
import { PatientFeesSection } from '@/components/patients/patient-fees-section'
import { AdvancedDateSelect } from '@/components/shared/advanced-date-select'
import { AdvancedPhoneInput } from '@/components/shared/advanced-phone-input'
import { AdvancedNotesInput } from '@/components/shared/advanced-notes-input'
import { CreatableMultiSelect } from '@/components/shared/creatable-multi-select'
import { clinicFormFieldItemClass, clinicFormGridClass, RequiredFormLabel } from '@/components/shared/form-field-layout'
import { DEFAULT_DIET_SUGGESTIONS, DEFAULT_MEDICINE_VAULT_OPTIONS } from '@/data/medicine-vault-options'
import { DEFAULT_DISEASES } from '@/data/default-diseases'
import { fetchMedicines } from '@/services/pharmacy-api'
import { createDisease, fetchDiseases } from '@/services/disease-api'
import { toast } from 'sonner'
import {
  getDefaultMedicineRow,
  type PatientRegistrationFormValues,
} from '@/lib/patient-registration-schema'
import { cn } from '@/lib/utils'
import type { CreatableMultiSelectOption } from '@/components/shared/creatable-multi-select'

interface MedicineOption {
  id: string
  name: string
}

interface PatientRegistrationFormProps {
  form: UseFormReturn<PatientRegistrationFormValues>
  onDiseaseOptionsChange?: (options: CreatableMultiSelectOption[]) => void
}

export function PatientRegistrationFormSections({
  form,
  onDiseaseOptionsChange,
}: PatientRegistrationFormProps) {
  const medicineFields = useFieldArray({ control: form.control, name: 'medicines' })
  const dietFields = useFieldArray({ control: form.control, name: 'dietItems' })
  const [medicineOptions, setMedicineOptions] = useState<MedicineOption[]>(
    DEFAULT_MEDICINE_VAULT_OPTIONS.map((m) => ({ id: m.id, name: m.name }))
  )
  const [diseaseOptions, setDiseaseOptions] = useState<CreatableMultiSelectOption[]>(
    DEFAULT_DISEASES.map((name) => ({ value: name.toLowerCase().replace(/\s+/g, '-'), label: name }))
  )

  const [medicinesLoading, setMedicinesLoading] = useState(true)
  const [diseasesLoading, setDiseasesLoading] = useState(true)

  useEffect(() => {
    onDiseaseOptionsChange?.(diseaseOptions)
  }, [diseaseOptions, onDiseaseOptionsChange])

  useEffect(() => {
    let active = true
    fetchMedicines({ limit: 100 })
      .then((res) => {
        if (!active || res.data.length === 0) return
        setMedicineOptions(res.data.map((item) => ({ id: item.id, name: item.name })))
      })
      .catch(() => {})
      .finally(() => {
        if (active) setMedicinesLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchDiseases()
      .then((rows) => {
        if (!active || rows.length === 0) return
        setDiseaseOptions(rows.map((d) => ({ value: d.id, label: d.name })))
      })
      .catch(() => {})
      .finally(() => {
        if (active) setDiseasesLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleCreateDisease = async (name: string) => {
    try {
      const created = await createDisease({ name })
      const option = { value: created.id, label: created.name }
      setDiseaseOptions((prev) => {
        if (prev.some((o) => o.value === option.value)) return prev
        return [...prev, option].sort((a, b) => a.label.localeCompare(b.label))
      })
      return option
    } catch {
      toast.error('Failed to save disease')
      return null
    }
  }

  const addMedicineRow = () => {
    medicineFields.append(getDefaultMedicineRow())
  }

  const addDietRow = () => {
    dietFields.append({ item: '', amount: '' })
  }

  return (
    <>
      <BentoCard colSpan={6} accent="patients" delay={60}>
        <PatientFormSectionHeader
          accent="patients"
          title="Patient details"
          subtitle="Visit date, name, contact, and address"
          icon={UserRound}
          secondaryIcon={CalendarDays}
        />
        <div className={clinicFormGridClass}>
          <FormField
            control={form.control}
            name="visitDate"
            render={({ field }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'sm:col-span-2')}>
                <RequiredFormLabel>Date</RequiredFormLabel>
                <FormControl>
                  <AdvancedDateSelect value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
              <FormItem className={clinicFormFieldItemClass}>
                <RequiredFormLabel>Name</RequiredFormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Patient full name"
                    className="clinic-form-input h-10"
                    autoComplete="name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact"
            render={({ field, fieldState }) => (
              <FormItem className={clinicFormFieldItemClass}>
                <FormLabel>Contact</FormLabel>
                <FormControl>
                  <AdvancedPhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'sm:col-span-2')}>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Street, area, city"
                    className="clinic-form-input h-10"
                    autoComplete="street-address"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </BentoCard>

      <BentoCard colSpan={6} accent="prescriptions" delay={120}>
        <PatientFormSectionHeader
          accent="prescriptions"
          title="Consultation"
          subtitle="Disease and prescription details"
          icon={Stethoscope}
          secondaryIcon={ClipboardList}
        />
        <div className={clinicFormGridClass}>
          <FormField
            control={form.control}
            name="diseases"
            render={({ field }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'sm:col-span-2')}>
                <RequiredFormLabel>Disease</RequiredFormLabel>
                <FormControl>
                  <CreatableMultiSelect
                    options={diseaseOptions}
                    selected={field.value}
                    onChange={field.onChange}
                    onCreateOption={handleCreateDisease}
                    disabled={diseasesLoading}
                    placeholder={diseasesLoading ? 'Loading diseases...' : 'Select or add diseases'}
                    searchPlaceholder="Search or type new disease..."
                    emptyMessage="No diseases found."
                    createLabel={(term) => `Add disease "${term}"`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="prescription"
            render={({ field, fieldState }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'sm:col-span-2')}>
                <FormLabel>Prescription</FormLabel>
                <FormControl>
                  <AdvancedNotesInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="General prescription notes and instructions…"
                    maxLength={500}
                    aria-invalid={!!fieldState.error}
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </BentoCard>

      <BentoCard colSpan={12} accent="medicines" delay={180}>
        <PatientFormSectionHeader
          accent="medicines"
          title="Medicines"
          subtitle="Select medicines, form type, quantity, frequency, and timing"
          icon={Pill}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="clinic-hero-btn h-8 gap-1.5"
              onClick={addMedicineRow}
            >
              <Plus className="h-3.5 w-3.5" />
              Add medicine
            </Button>
          }
        />
        <div className="space-y-3">
          {medicineFields.fields.map((row, index) => (
            <PrescriptionMedicineRow
              key={row.id}
              form={form}
              index={index}
              medicineOptions={medicineOptions}
              optionsLoading={medicinesLoading}
              showLabels={index === 0}
              canRemove={medicineFields.fields.length > 1}
              onRemove={() => medicineFields.remove(index)}
            />
          ))}
          {form.formState.errors.medicines?.message ? (
            <p className="text-sm text-destructive">{String(form.formState.errors.medicines.message)}</p>
          ) : null}
        </div>
      </BentoCard>

      <BentoCard colSpan={12} accent="inventory" delay={240}>
        <PatientFormSectionHeader
          accent="inventory"
          title="Diet"
          subtitle="Dietary advice with amounts"
          icon={Leaf}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="clinic-hero-btn h-8 gap-1.5"
              onClick={addDietRow}
            >
              <Plus className="h-3.5 w-3.5" />
              Add diet item
            </Button>
          }
        />
        {dietFields.fields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-6 text-center text-sm text-muted-foreground">
            No diet items yet. Use the plus button to add dietary recommendations.
          </p>
        ) : (
          <div className="space-y-3">
            {dietFields.fields.map((row, index) => (
              <div
                key={row.id}
                className="grid gap-3 rounded-xl border border-border/60 bg-[hsl(var(--muted)/0.12)] p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <FormField
                  control={form.control}
                  name={`dietItems.${index}.item`}
                  render={({ field }) => (
                    <FormItem className={clinicFormFieldItemClass}>
                      <FormLabel className={index === 0 ? undefined : 'sr-only'}>
                        Diet item
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          list={`diet-suggestions-${index}`}
                          placeholder="e.g. Warm water, light meals"
                          className="clinic-form-input h-10"
                        />
                      </FormControl>
                      <datalist id={`diet-suggestions-${index}`}>
                        {DEFAULT_DIET_SUGGESTIONS.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`dietItems.${index}.amount`}
                  render={({ field }) => (
                    <FormItem className={clinicFormFieldItemClass}>
                      <FormLabel className={index === 0 ? undefined : 'sr-only'}>
                        Amount
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. 2 times daily, 1 cup"
                          className="clinic-form-input h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end justify-end pb-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => dietFields.remove(index)}
                    aria-label="Remove diet item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      <BentoCard colSpan={12} accent="prescriptions" delay={300}>
        <PatientFormSectionHeader
          accent="prescriptions"
          title="Additional notes"
          subtitle="Optional remarks for this visit"
          icon={ClipboardList}
        />
        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field, fieldState }) => (
            <FormItem className={clinicFormFieldItemClass}>
              <FormControl>
                <AdvancedNotesInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Follow-up instructions, lifestyle advice, or other notes…"
                  aria-invalid={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </BentoCard>

      <PatientFeesSection form={form} />
    </>
  )
}