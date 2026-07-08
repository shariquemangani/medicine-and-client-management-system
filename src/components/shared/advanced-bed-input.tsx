'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { sanitizeDigitsInput } from '@/lib/input-sanitize'
import { clinicFormControlClass } from '@/components/shared/form-field-layout'

const MAX_BED_DIGITS = 4

export interface AdvancedBedInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
  'aria-invalid'?: boolean
}

export function AdvancedBedInput({
  value,
  onChange,
  disabled = false,
  className,
  id,
  'aria-invalid': ariaInvalid,
}: AdvancedBedInputProps) {
  const digits = sanitizeDigitsInput(value, MAX_BED_DIGITS)

  return (
    <div
      id={id}
      className={cn(
        clinicFormControlClass,
        'flex h-10 items-center gap-2 px-3',
        'focus-within:border-[hsl(var(--metric-inventory)/0.5)] focus-within:ring-2 focus-within:ring-[hsl(var(--metric-inventory)/0.12)]',
        ariaInvalid && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
      aria-invalid={ariaInvalid}
    >
      <span className="shrink-0 rounded-md bg-[hsl(var(--metric-inventory)/0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--metric-inventory))]">
        {'Bed'}
      </span>
      <span className="text-sm font-semibold text-muted-foreground" aria-hidden>
        #
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        value={digits}
        placeholder={'Enter bed number'}
        aria-label={'Bed no'}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold tabular-nums text-foreground shadow-none focus-visible:outline-none"
        onChange={(event) => onChange(sanitizeDigitsInput(event.target.value, MAX_BED_DIGITS))}
      />
    </div>
  )
}
