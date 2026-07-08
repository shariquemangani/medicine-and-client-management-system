'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { sanitizeDigitsInput } from '@/lib/input-sanitize'

const GROUP_LENGTH = 4
const GROUP_COUNT = 3
const TOTAL_LENGTH = GROUP_LENGTH * GROUP_COUNT

function splitAadharGroups(value: string): [string, string, string] {
  const digits = sanitizeDigitsInput(value, TOTAL_LENGTH)
  return [
    digits.slice(0, GROUP_LENGTH),
    digits.slice(GROUP_LENGTH, GROUP_LENGTH * 2),
    digits.slice(GROUP_LENGTH * 2, TOTAL_LENGTH),
  ]
}

export interface AdvancedAadharInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
  'aria-invalid'?: boolean
  compact?: boolean
}

export function formatAadharDisplay(value: string): string {
  return splitAadharGroups(value).join(' ').trim()
}

export function AdvancedAadharInput({
  value,
  onChange,
  disabled = false,
  className,
  id,
  'aria-invalid': ariaInvalid,
  compact = false,
}: AdvancedAadharInputProps) {
  const groups = splitAadharGroups(value)
  const refs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
  ]

  const updateGroup = (index: number, nextGroup: string) => {
    const sanitized = sanitizeDigitsInput(nextGroup, GROUP_LENGTH)
    const next = [...groups] as [string, string, string]
    next[index] = sanitized
    onChange(next.join(''))

    if (sanitized.length === GROUP_LENGTH && index < GROUP_COUNT - 1) {
      refs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !groups[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = sanitizeDigitsInput(event.clipboardData.getData('text'), TOTAL_LENGTH)
    if (!pasted) return
    onChange(pasted)
    const focusIndex = Math.min(Math.floor((pasted.length - 1) / GROUP_LENGTH), GROUP_COUNT - 1)
    refs[focusIndex].current?.focus()
  }

  const filled = sanitizeDigitsInput(value, TOTAL_LENGTH).length

  return (
    <div
      id={id}
      className={cn(
        'clinic-aadhar-input flex h-10 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 shadow-sm transition-colors sm:gap-2 sm:px-3',
        'focus-within:border-[hsl(var(--metric-patients)/0.5)] focus-within:ring-2 focus-within:ring-[hsl(var(--metric-patients)/0.12)]',
        ariaInvalid && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
      aria-invalid={ariaInvalid}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5">
        {groups.map((group, index) => (
          <React.Fragment key={index}>
            <input
              ref={refs[index]}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={GROUP_LENGTH}
              disabled={disabled}
              value={group}
              placeholder={'0000'}
              aria-label={`Aadhar part ${index + 1}`}
              className={cn(
                'h-8 min-w-0 flex-1 border-0 bg-transparent px-0 text-center font-mono text-xs tracking-widest shadow-none sm:text-sm sm:tracking-[0.2em]',
                'focus-visible:outline-none focus-visible:ring-0'
              )}
              onChange={(event) => updateGroup(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
            />
            {index < GROUP_COUNT - 1 ? (
              <span className="text-xs font-semibold text-muted-foreground" aria-hidden>
                –
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
      {!compact ? (
        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {filled}/{TOTAL_LENGTH}
        </span>
      ) : null}
    </div>
  )
}
