'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AdvancedLimitedTextInputProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
  disabled?: boolean
  className?: string
  id?: string
  type?: string
  placeholder?: string
  'aria-invalid'?: boolean
}

export function AdvancedLimitedTextInput({
  value,
  onChange,
  maxLength,
  disabled = false,
  className,
  id,
  type = 'text',
  placeholder,
  'aria-invalid': ariaInvalid,
}: AdvancedLimitedTextInputProps) {
  const length = value.length

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value.slice(0, maxLength))
  }

  return (
    <div
      id={id}
      className={cn(
        'clinic-limited-text-input clinic-form-input clinic-form-control flex h-10 items-stretch overflow-hidden rounded-md p-0 shadow-sm transition-colors',
        ariaInvalid && 'clinic-limited-text-input--invalid border-destructive',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
      aria-invalid={ariaInvalid}
    >
      <input
        type={type}
        disabled={disabled}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent px-3 text-sm shadow-none',
          'placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-0'
        )}
        onChange={handleChange}
      />
      <span className="clinic-limited-text-counter flex shrink-0 items-center border-l border-border/70 bg-muted/25 px-2.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
        {length}/{maxLength}
      </span>
    </div>
  )
}
