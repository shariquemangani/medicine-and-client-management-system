import { cn } from '@/lib/utils'
import { FormLabel } from '@/components/ui/form'

/** Half-width field wrapper for responsive form grids (50% on sm+). */
export function FormFieldHalf({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('min-w-0 w-full sm:max-w-[50%]', className)}>{children}</div>
}

/** Red asterisk for required form field labels. */
export function FormRequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {' *'}
    </span>
  )
}

export function RequiredFormLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <FormLabel className={className}>
      {children}
      <FormRequiredMark />
    </FormLabel>
  )
}

/** Shared spacing for clinic form sections. */
export const clinicFormFieldItemClass = 'gap-1.5'
export const clinicFormGridClass = 'grid grid-cols-1 gap-4 sm:grid-cols-2'
export const clinicFormSectionTitleClass = 'clinic-form-section-title mb-4'
export const clinicFormSectionHeaderClass = 'mb-4 flex items-start justify-between gap-3'

/** Two-column paired field grid. */
export function FormFieldGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(clinicFormGridClass, className)}>{children}</div>
}

export const clinicFormControlClass =
  'clinic-form-input clinic-form-control h-10 w-full rounded-md text-sm font-normal shadow-sm transition-colors'

export const advancedFieldTriggerClass = cn(
  clinicFormControlClass,
  'justify-between text-left'
)

export const clinicFormButtonClass = cn(
  clinicFormControlClass,
  'justify-center px-3 font-medium'
)

export const advancedFieldSelectClass = clinicFormControlClass
