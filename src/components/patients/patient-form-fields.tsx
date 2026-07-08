'use client'

import { format } from 'date-fns'
import { BookOpen, GraduationCap, Moon, Plus, School, ScrollText, UserRound, Users, UserMinus } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import type { Medicine } from '@/types'
import { DEFAULT_MEDICINE_CATEGORIES } from '@/data/medicine-categories'
import { AdvancedAadharInput } from '@/components/shared/advanced-aadhar-input'
import { AdvancedPhoneInput } from '@/components/shared/advanced-phone-input'
import { AdvancedDateSelect } from '@/components/shared/advanced-date-select'
import { AdvancedSelect } from '@/components/shared/advanced-select'
import { GUARDIAN_RELATION_OTHER, GUARDIAN_RELATIONS } from '@/data/guardian-relations'
import { AdvancedTimeRangeSelect } from '@/components/shared/advanced-time-select'
import { FormFieldGrid, RequiredFormLabel, clinicFormFieldItemClass, clinicFormGridClass } from '@/components/shared/form-field-layout'
import { PatientFormSectionHeader } from '@/components/patients/patient-form-section-header'
import { AdvancedNotesInput } from '@/components/shared/advanced-notes-input'
import { AdvancedLimitedTextInput } from '@/components/shared/advanced-limited-text-input'
import type { PatientFormValues } from '@/lib/patient-form-schema'
import {
  getPatientDobMinDate,
  getPatientDobMaxDate,
  MAX_MADRASA_NAME_LENGTH,
  MAX_SCHOOL_NAME_LENGTH,
  MAX_PATIENT_NAME_LENGTH,
} from '@/lib/patient-form-schema'
import { sanitizeDigitsInput } from '@/lib/input-sanitize'
import { getTranslatedClassName } from '@/lib/patient-display'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

function parseDateString(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return undefined
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export type PatientClassOption = {
  id: string
  name: string
  labelKey?: string
}

interface PatientFormFieldsProps {
  form: UseFormReturn<PatientFormValues>
  classes: (Medicine & { patientCount?: number })[] | PatientClassOption[]
}

type PatientTextFieldName = Exclude<keyof PatientFormValues, 'hasSecondaryGuardian' | 'hasSchoolInfo'>

function TextField({
  form,
  name,
  label,
  type = 'text',
  sanitize,
  labelClassName,
  required = false,
  maxLength,
}: {
  form: UseFormReturn<PatientFormValues>
  name: PatientTextFieldName
  label: string
  type?: string
  sanitize?: (value: string) => string
  labelClassName?: string
  required?: boolean
  maxLength?: number
}) {
  const Label = required ? RequiredFormLabel : FormLabel

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={clinicFormFieldItemClass}>
          <Label className={labelClassName}>{label}</Label>
          <FormControl>
            {maxLength ? (
              <AdvancedLimitedTextInput
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={(value) => field.onChange(sanitize ? sanitize(value) : value)}
                maxLength={maxLength}
                type={type}
                aria-invalid={!!fieldState.error}
              />
            ) : (
              <Input
                type={type}
                className="clinic-form-input h-10"
                value={field.value}
                onChange={(e) => field.onChange(sanitize ? sanitize(e.target.value) : e.target.value)}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function AadharField({
  form,
  name,
  label,
  labelClassName,
  compact,
  required = false,
}: {
  form: UseFormReturn<PatientFormValues>
  name: 'aadharNumber' | 'guardianAadhar' | 'secondaryGuardianAadhar'
  label: string
  labelClassName?: string
  compact?: boolean
  required?: boolean
}) {
  const Label = required ? RequiredFormLabel : FormLabel

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={clinicFormFieldItemClass}>
          <Label className={labelClassName}>{label}</Label>
          <FormControl>
            <AdvancedAadharInput
              value={field.value ?? ''}
              onChange={field.onChange}
              aria-invalid={!!fieldState.error}
              className={compact ? 'clinic-aadhar-input--compact' : undefined}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function MobileField({
  form,
  name,
  label,
  required = false,
}: {
  form: UseFormReturn<PatientFormValues>
  name: 'patientPhone' | 'guardianMobile' | 'secondaryGuardianMobile'
  label: string
  required?: boolean
}) {
  const Label = required ? RequiredFormLabel : FormLabel

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={clinicFormFieldItemClass}>
          <Label>{label}</Label>
          <FormControl>
            <AdvancedPhoneInput
              value={field.value ?? ''}
              onChange={field.onChange}
              aria-invalid={!!fieldState.error}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function useStandardOptions(classes: PatientFormFieldsProps['classes']) {
  const options =
    classes.length > 0
      ? classes
      : DEFAULT_MEDICINE_CATEGORIES.map((level) => ({
          id: level.id,
          name: level.name,
          labelKey: level.labelKey,
        }))

  return options.map((c) => {
    const option = c as PatientClassOption
    const label = option.labelKey ? t(option.labelKey) : getTranslatedClassName(c.name)
    return { value: c.id, label }
  })
}

export function PatientIdentitySection(props: PatientFormFieldsProps) {

  return (
    <>
      <PatientFormSectionHeader
        accent="patients"
        title={'Patient information'}
        subtitle={'Personal details, contact & identity'}
        icon={UserRound}
        secondaryIcon={GraduationCap}
      />
      <PatientIdentityFields {...props} />
    </>
  )
}

export function PatientIdentityFields({ form }: PatientFormFieldsProps) {

  return (
    <FormFieldGrid>
      <div className="sm:col-span-2">
        <TextField
          form={form}
          name="patientName"
          label={'Name of the patient'}
          required
          maxLength={MAX_PATIENT_NAME_LENGTH}
        />
      </div>
      <TextField form={form} name="rollNumber" label={'Roll no'} sanitize={sanitizeDigitsInput} required />
      <FormField
        control={form.control}
        name="dateOfBirth"
        render={({ field }) => (
          <FormItem className={clinicFormFieldItemClass}>
            <RequiredFormLabel>{'Date of birth'}</RequiredFormLabel>
            <FormControl>
              <DatePicker
                value={parseDateString(field.value)}
                onChange={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                minDate={getPatientDobMinDate()}
                maxDate={getPatientDobMaxDate()}
                placeholder={'Select date of birth'}
                className="clinic-form-input clinic-dob-picker h-10 w-full shadow-none hover:bg-[hsl(var(--muted)/0.35)]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <MobileField
        form={form}
        name="patientPhone"
        label={'Phone number'}
        required
      />
      <AadharField form={form} name="aadharNumber" label={'Aadhar number'} required />
      <div className="sm:col-span-2">
        <TextField form={form} name="address" label={'Address'} required />
      </div>
    </FormFieldGrid>
  )
}

export function PatientMadrasaSection(props: PatientFormFieldsProps) {

  return (
    <>
      <PatientFormSectionHeader
        accent="inventory"
        title={'Madrasa'}
        arabicLabel={'المدرسة'}
        subtitle={'Islamic education & madrasa enrollment'}
        icon={Moon}
        secondaryIcon={BookOpen}
      />
      <PatientMadrasaFields {...props} />
    </>
  )
}

export function PatientMadrasaFields({ form }: PatientFormFieldsProps) {

  return (
    <FormFieldGrid>
      <div className="sm:col-span-2">
        <TextField form={form} name="madrasaName" label={'Madrasa name'} required maxLength={MAX_MADRASA_NAME_LENGTH} />
      </div>
      <div className="sm:col-span-2">
        <TextField form={form} name="madrasaLocation" label={'Madrasa location'} />
      </div>
      <FormField
        control={form.control}
        name="admissionDate"
        render={({ field }) => (
          <FormItem className={cn(clinicFormFieldItemClass, 'min-w-0 sm:col-span-2')}>
            <RequiredFormLabel>{'Date of Admission'}</RequiredFormLabel>
            <FormControl>
              <AdvancedDateSelect value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <TextField form={form} name="classSection" label={'Block section'} />
      <TextField
        form={form}
        name="fees"
        label={'Billing'}
        type="tel"
        sanitize={sanitizeDigitsInput}
        required
      />
    </FormFieldGrid>
  )
}

export function PatientAcademicFields({ form, classes }: PatientFormFieldsProps) {
  const standardOptions = useStandardOptions(classes)

  return (
    <FormFieldGrid>
      <div className="sm:col-span-2">
        <TextField form={form} name="schoolName" label={'School / college name'} required maxLength={MAX_SCHOOL_NAME_LENGTH} />
      </div>
      <div className="sm:col-span-2">
        <TextField form={form} name="schoolLocation" label={'School / college location'} />
      </div>
      <FormField
        control={form.control}
        name="standard"
        render={({ field }) => (
          <FormItem className={cn(clinicFormFieldItemClass, 'min-w-0')}>
            <RequiredFormLabel>{'Operations level'}</RequiredFormLabel>
            <FormControl>
              <AdvancedSelect
                value={field.value ?? ''}
                onChange={field.onChange}
                options={standardOptions}
                placeholder={t('patients.selectAcademicLevel')}
                emptyMessage={'No classes found'}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="schoolTiming"
        render={({ field }) => (
          <FormItem className={cn(clinicFormFieldItemClass, 'min-w-0')}>
            <RequiredFormLabel>{'School / college timing'}</RequiredFormLabel>
            <FormControl>
              <AdvancedTimeRangeSelect
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder={'09 AM - 05:30 PM'}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormFieldGrid>
  )
}

/** @deprecated Use PatientMadrasaFields or PatientAcademicFields */
export function PatientSchoolFields(props: PatientFormFieldsProps) {
  return (
    <>
      <PatientMadrasaFields {...props} />
      <PatientAcademicSection {...props} />
    </>
  )
}

export function PatientAcademicSection({ form, classes }: PatientFormFieldsProps) {
  const hasSchoolInfo = form.watch('hasSchoolInfo')

  const handleSchoolInfoToggle = (enabled: boolean) => {
    form.setValue('hasSchoolInfo', enabled, { shouldDirty: true })
    if (!enabled) {
      form.setValue('schoolName', '')
      form.setValue('schoolLocation', '')
      form.setValue('schoolTiming', '')
      form.setValue(
        'standard',
        classes[0]?.id ?? DEFAULT_MEDICINE_CATEGORIES[0]?.id ?? 'class-1'
      )
      form.clearErrors(['schoolName', 'schoolLocation', 'standard', 'schoolTiming'])
      return
    }
    form.clearErrors(['schoolName', 'schoolLocation', 'standard', 'schoolTiming'])
  }

  return (
    <>
      <PatientFormSectionHeader
        accent="medicines"
        title={'School & college'}
        subtitle={'Day institution — name, location, academic level & timing'}
        icon={School}
        secondaryIcon={GraduationCap}
        actions={
          <>
            <span
              className={cn(
                'text-xs font-semibold',
                hasSchoolInfo ? 'text-[hsl(var(--metric-medicines))]' : 'text-muted-foreground'
              )}
            >
              {hasSchoolInfo ? 'Enabled' : 'Disabled'}
            </span>
            <Switch
              checked={hasSchoolInfo}
              onCheckedChange={handleSchoolInfoToggle}
              aria-label={'School & college'}
              className="data-[state=checked]:bg-[hsl(var(--metric-medicines))]"
            />
          </>
        }
      />

      {hasSchoolInfo ? (
        <PatientAcademicFields form={form} classes={classes} />
      ) : (
        <div className="clinic-form-section-disabled rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">{'School & college details are turned off. Enable this section to add institution name, location, academic level, and timing.'}</p>
        </div>
      )}
    </>
  )
}

export function PatientGuardianSection(props: PatientFormFieldsProps) {

  return (
    <>
      <PatientFormSectionHeader
        accent="staff"
        title={'Guardian information'}
        subtitle={'Primary contact & optional secondary guardian'}
        icon={Users}
        secondaryIcon={UserRound}
      />
      <PatientGuardianFields {...props} />
    </>
  )
}

export function PatientGuardianFields({ form }: PatientFormFieldsProps) {
  const aadharLabel = 'Aadhar number'
  const selectedRelation = form.watch('guardianRelation')
  const hasSecondary = form.watch('hasSecondaryGuardian')
  const secondaryRelation = form.watch('secondaryGuardianRelation')
  const guardianRelationOptions = GUARDIAN_RELATIONS.map((item) => ({
    value: item.value,
    label: t(item.labelKey),
  }))

  const clearSecondaryGuardian = () => {
    form.setValue('hasSecondaryGuardian', false)
    form.setValue('secondaryGuardianName', '')
    form.setValue('secondaryGuardianAadhar', '')
    form.setValue('secondaryGuardianMobile', '')
    form.setValue('secondaryGuardianRelation', '')
    form.setValue('secondaryGuardianRelationOther', '')
  }

  return (
    <div className={clinicFormGridClass}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--metric-staff))] sm:col-span-2">
        {'Primary guardian'}
      </p>

      <FormField
        control={form.control}
        name="guardianRelation"
        render={({ field }) => (
          <FormItem className={cn(clinicFormFieldItemClass, 'sm:col-span-2')}>
            <RequiredFormLabel>{'Guardian relation'}</RequiredFormLabel>
            <FormControl>
              <AdvancedSelect
                value={field.value}
                onChange={field.onChange}
                options={guardianRelationOptions}
                placeholder={'Select relation'}
                emptyMessage={'No classes found'}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedRelation === GUARDIAN_RELATION_OTHER ? (
        <FormField
          control={form.control}
          name="guardianRelationOther"
          render={({ field }) => (
            <FormItem className={cn(clinicFormFieldItemClass, 'sm:col-span-2')}>
              <RequiredFormLabel>{'Specify relation'}</RequiredFormLabel>
              <FormControl>
                <Input
                  className="clinic-form-input h-10"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={'Enter relation'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      <TextField form={form} name="guardianName" label={'Guardian name'} required />
      <AadharField form={form} name="guardianAadhar" label={aadharLabel} compact required />
      <MobileField
        form={form}
        name="guardianMobile"
        label={'Guardian mobile no'}
        required
      />

      {hasSecondary ? (
        <>
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--metric-inventory))]">
              {'Secondary guardian'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="clinic-hero-btn h-8 gap-1.5 rounded-lg px-2.5 text-xs"
              onClick={clearSecondaryGuardian}
            >
              <UserMinus className="h-3.5 w-3.5" />
              {'Remove secondary'}
            </Button>
          </div>

          <FormField
            control={form.control}
            name="secondaryGuardianRelation"
            render={({ field }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'sm:col-span-2')}>
                <RequiredFormLabel>{'Guardian relation'}</RequiredFormLabel>
                <FormControl>
                  <AdvancedSelect
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    options={guardianRelationOptions}
                    placeholder={'Select relation'}
                    emptyMessage={'No classes found'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {secondaryRelation === GUARDIAN_RELATION_OTHER ? (
            <FormField
              control={form.control}
              name="secondaryGuardianRelationOther"
              render={({ field }) => (
                <FormItem className={cn(clinicFormFieldItemClass, 'sm:col-span-2')}>
                  <RequiredFormLabel>{'Specify relation'}</RequiredFormLabel>
                  <FormControl>
                    <Input
                      className="clinic-form-input h-10"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={'Enter relation'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <TextField
            form={form}
            name="secondaryGuardianName"
            label={'Guardian name'}
            required
          />
          <AadharField
            form={form}
            name="secondaryGuardianAadhar"
            label={aadharLabel}
            compact
            required
          />
          <MobileField
            form={form}
            name="secondaryGuardianMobile"
            label={'Guardian mobile no'}
            required
          />
        </>
      ) : (
        <div className="sm:col-span-2">
          <Button
            type="button"
            variant="outline"
            className="clinic-hero-btn h-10 w-full gap-2 rounded-xl text-xs font-semibold sm:w-auto"
            onClick={() => {
              form.setValue('hasSecondaryGuardian', true)
              if (!form.getValues('secondaryGuardianRelation')) {
                form.setValue('secondaryGuardianRelation', 'Parent')
              }
            }}
          >
            <Plus className="h-4 w-4" />
            {'Add secondary guardian'}
          </Button>
        </div>
      )}
    </div>
  )
}

/** @deprecated Use PatientGuardianFields */
export function PatientParentFields(props: PatientFormFieldsProps) {
  return <PatientGuardianFields {...props} />
}

export function PatientNotesSection(props: PatientFormFieldsProps) {

  return (
    <>
      <PatientFormSectionHeader
        accent="prescriptions"
        title={'Admission notes'}
        subtitle={'Optional remarks recorded at enrollment'}
        icon={ScrollText}
        secondaryIcon={BookOpen}
      />
      <PatientNotesFields {...props} />
    </>
  )
}

export function PatientNotesFields({ form }: PatientFormFieldsProps) {

  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field, fieldState }) => (
        <FormItem className={clinicFormFieldItemClass}>
          <FormLabel className="sr-only">{'Admission notes'}</FormLabel>
          <FormControl>
            <AdvancedNotesInput
              value={field.value ?? ''}
              onChange={field.onChange}
              aria-invalid={!!fieldState.error}
              placeholder={'Enter admission notes, special instructions, or remarks…'}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
