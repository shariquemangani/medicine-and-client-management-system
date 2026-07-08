'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  composePhoneValue,
  formatMobileDisplay,
  getCountryCodeConfig,
  parsePhoneValue,
  PHONE_COUNTRY_CODES,
  sanitizeMobileDigits,
} from '@/lib/phone-utils'

export interface AdvancedPhoneInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
  placeholder?: string
  'aria-invalid'?: boolean
}

export function AdvancedPhoneInput({
  value,
  onChange,
  disabled = false,
  className,
  id,
  placeholder,
  'aria-invalid': ariaInvalid,
}: AdvancedPhoneInputProps) {
  const parsed = parsePhoneValue(value)
  const [countryCode, setCountryCode] = React.useState(parsed.countryCode)
  const [digits, setDigits] = React.useState(parsed.number)
  const maxLength = getCountryCodeConfig(countryCode).digits

  React.useEffect(() => {
    const next = parsePhoneValue(value)
    setCountryCode(next.countryCode)
    setDigits(next.number)
  }, [value])

  const emitChange = (nextCountryCode: string, nextDigits: string) => {
    onChange(composePhoneValue(nextCountryCode, nextDigits))
  }

  const handleCountryChange = (nextCountryCode: string) => {
    const nextMax = getCountryCodeConfig(nextCountryCode).digits
    const nextDigits = sanitizeMobileDigits(digits, nextMax)
    setCountryCode(nextCountryCode)
    setDigits(nextDigits)
    emitChange(nextCountryCode, nextDigits)
  }

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = sanitizeMobileDigits(event.target.value, maxLength)
    setDigits(nextDigits)
    emitChange(countryCode, nextDigits)
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = sanitizeMobileDigits(event.clipboardData.getData('text'), maxLength)
    if (!pasted) return
    setDigits(pasted)
    emitChange(countryCode, pasted)
  }

  const displayValue = formatMobileDisplay(digits, countryCode)

  return (
    <div
      id={id}
      className={cn(
        'clinic-phone-input clinic-form-input clinic-form-control flex h-10 items-stretch overflow-hidden rounded-md p-0 shadow-sm transition-colors',
        ariaInvalid && 'clinic-phone-input--invalid border-destructive',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
      aria-invalid={ariaInvalid}
    >
      <Select value={countryCode} onValueChange={handleCountryChange} disabled={disabled}>
        <SelectTrigger
          aria-label={'Country code'}
          className="clinic-phone-country-trigger h-full w-[5.75rem] shrink-0 rounded-none border-0 border-r border-border/70 bg-muted/25 px-2.5 shadow-none ring-0 ring-offset-0 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-muted/40"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="clinic-phone-country-content min-w-[5.75rem]">
          {PHONE_COUNTRY_CODES.map((country) => (
            <SelectItem key={country.value} value={country.value} className="cursor-pointer">
              {country.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        disabled={disabled}
        value={displayValue}
        placeholder={placeholder || '98765 43210'}
        aria-label={'Mobile number'}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent px-3 text-sm tracking-wide shadow-none',
          'placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-0'
        )}
        onChange={handleNumberChange}
        onPaste={handlePaste}
      />
      <span className="clinic-phone-counter flex shrink-0 items-center border-l border-border/70 bg-muted/25 px-2.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
        {digits.length}/{maxLength}
      </span>
    </div>
  )
}
