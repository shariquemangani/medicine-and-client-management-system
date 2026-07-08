'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

const DEFAULT_MAX_LENGTH = 500

export interface AdvancedNotesInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
  placeholder?: string
  maxLength?: number
  'aria-invalid'?: boolean
}

export function AdvancedNotesInput({
  value,
  onChange,
  disabled = false,
  className,
  id,
  placeholder,
  maxLength = DEFAULT_MAX_LENGTH,
  'aria-invalid': ariaInvalid,
}: AdvancedNotesInputProps) {
  const length = value.length

  return (
    <div
      id={id}
      className={cn(
        'clinic-notes-input overflow-hidden rounded-md border border-input bg-background shadow-sm transition-colors',
        'focus-within:border-[hsl(var(--metric-prescriptions)/0.5)] focus-within:ring-2 focus-within:ring-[hsl(var(--metric-prescriptions)/0.12)]',
        ariaInvalid && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
      aria-invalid={ariaInvalid}
    >
      <Textarea
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder || 'Enter admission notes, special instructions, or remarks…'}
        className="min-h-[120px] resize-y border-0 bg-transparent px-3 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-3 py-2">
        <span className="text-[11px] text-muted-foreground">{'Optional — recorded at admission and visible on the patient profile'}</span>
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {length}/{maxLength}
        </span>
      </div>
    </div>
  )
}
