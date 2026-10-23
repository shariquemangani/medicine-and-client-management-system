'use client'

import type { UseFormReturn } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreatableMultiSelect } from '@/components/shared/creatable-multi-select'
import { AdvancedSelect } from '@/components/shared/advanced-select'
import {
  FREQUENCY_OPTIONS,
  MEDICINE_FORM_TYPES,
  MEDICINE_VOLUME_UNITS,
  OTHER_OPTION,
  TIMING_OPTIONS,
  usesNumericQuantity,
} from '@/data/prescription-options'
import type { PatientRegistrationFormValues } from '@/lib/patient-registration-schema'
import { clinicFormFieldItemClass, RequiredFormLabel } from '@/components/shared/form-field-layout'
import { cn } from '@/lib/utils'

interface MedicineOption {
  id: string
  name: string
}

interface PrescriptionMedicineRowProps {
  form: UseFormReturn<PatientRegistrationFormValues>
  index: number
  medicineOptions: MedicineOption[]
  optionsLoading?: boolean
  showLabels: boolean
  canRemove: boolean
  onRemove: () => void
}

export function PrescriptionMedicineRow({
  form,
  index,
  medicineOptions,
  optionsLoading = false,
  showLabels,
  canRemove,
  onRemove,
}: PrescriptionMedicineRowProps) {
  const formType = form.watch(`medicines.${index}.formType`)
  const frequency = form.watch(`medicines.${index}.frequency`)
  const timing = form.watch(`medicines.${index}.timing`)
  const numericQty = usesNumericQuantity(formType ?? '')
  const labelClass = showLabels ? undefined : 'sr-only'

  const vaultSelectOptions = medicineOptions.map((m) => ({
    value: m.id,
    label: m.name,
  }))

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-[hsl(var(--muted)/0.12)] p-3">
      <div className="flex items-end gap-2">
        <FormField
          control={form.control}
          name={`medicines.${index}.medicineIds`}
          render={({ field }) => (
            <FormItem className={cn(clinicFormFieldItemClass, 'min-w-0 flex-1')}>
              <RequiredFormLabel className={labelClass}>Medicine name</RequiredFormLabel>
              <FormControl>
                <CreatableMultiSelect
                  options={vaultSelectOptions}
                  selected={field.value}
                  onChange={(values) => {
                    field.onChange(values)
                    const names = values.map(
                      (id) => medicineOptions.find((m) => m.id === id)?.name ?? id
                    )
                    form.setValue(`medicines.${index}.medicineNames`, names)
                  }}
                  disabled={optionsLoading}
                  placeholder={optionsLoading ? 'Loading medicines...' : 'Select medicines'}
                  searchPlaceholder="Search medicines..."
                  emptyMessage="No medicines found."
                  className="min-h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className={cn(clinicFormFieldItemClass, 'flex w-[15rem] shrink-0 flex-col sm:w-[16rem]')}>
          <FormLabel className={labelClass}>Medicine quantity</FormLabel>
          <div className="flex h-10 items-center gap-2">
            <FormField
              control={form.control}
              name={`medicines.${index}.medicineQuantityMl`}
              render={({ field }) => (
                <FormItem className="min-w-0 flex-1 space-y-0">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step="any"
                      placeholder="Qty"
                      className="clinic-form-input h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`medicines.${index}.medicineQuantityUnit`}
              render={({ field }) => (
                <FormItem className="w-[5.25rem] shrink-0 space-y-0">
                  <Select value={field.value ?? 'ml'} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="clinic-form-input h-10 px-2" aria-label="Quantity unit">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEDICINE_VOLUME_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label="Remove medicine row"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-start gap-2 overflow-x-auto pb-1">
        <FormField
          control={form.control}
          name={`medicines.${index}.formType`}
          render={({ field }) => (
            <FormItem className={cn(clinicFormFieldItemClass, 'min-w-[7.5rem] shrink-0')}>
              <FormLabel className={labelClass}>Form type</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  form.setValue(`medicines.${index}.quantity`, '')
                  form.setValue(`medicines.${index}.quantityOther`, '')
                }}
              >
                <FormControl>
                  <SelectTrigger className="clinic-form-input h-10" aria-label="Medicine form">
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MEDICINE_FORM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {numericQty || !formType ? (
          <FormField
            control={form.control}
            name={`medicines.${index}.quantity`}
            render={({ field }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'min-w-[6.5rem] shrink-0')}>
                <FormLabel className={labelClass}>Quantity</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    placeholder="Enter number"
                    className="clinic-form-input h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name={`medicines.${index}.quantityOther`}
            render={({ field }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'min-w-[6.5rem] shrink-0')}>
                <FormLabel className={labelClass}>Quantity</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Describe amount"
                    className="clinic-form-input h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name={`medicines.${index}.frequency`}
          render={({ field }) => (
            <FormItem className={cn(clinicFormFieldItemClass, 'min-w-[9rem] shrink-0')}>
              <FormLabel className={labelClass}>Frequency (optional)</FormLabel>
              <FormControl>
                <AdvancedSelect
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  placeholder="Select frequency"
                  emptyMessage="No frequency found."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {frequency === OTHER_OPTION ? (
          <FormField
            control={form.control}
            name={`medicines.${index}.frequencyOther`}
            render={({ field }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'min-w-[7rem] shrink-0')}>
                <FormLabel className={labelClass}>Frequency (other)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Custom frequency"
                    className="clinic-form-input h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name={`medicines.${index}.timing`}
          render={({ field }) => (
            <FormItem className={cn(clinicFormFieldItemClass, 'min-w-[9rem] shrink-0')}>
              <FormLabel className={labelClass}>Timing (optional)</FormLabel>
              <FormControl>
                <AdvancedSelect
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={TIMING_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  placeholder="Select timing"
                  emptyMessage="No timing found."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {timing === OTHER_OPTION ? (
          <FormField
            control={form.control}
            name={`medicines.${index}.timingOther`}
            render={({ field }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'min-w-[7rem] shrink-0')}>
                <FormLabel className={labelClass}>Timing (other)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Custom timing"
                    className="clinic-form-input h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      </div>
    </div>
  )
}
