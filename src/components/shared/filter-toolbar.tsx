'use client'

import * as React from 'react'
import { Check, ChevronDown, Filter } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { SectionCard } from './section-card'

/** Standard toolbar card that sits above a table: filters on the left, result count on the right. */
export function FilterToolbar({
  children,
  count,
  className,
}: {
  children?: React.ReactNode
  /** e.g. "50 events". Pass a node (or skeleton) while loading. */
  count?: React.ReactNode
  className?: string
}) {
  return (
    <SectionCard className={className}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">{children}</div>
        {count !== undefined ? (
          <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground">{count}</span>
        ) : null}
      </div>
    </SectionCard>
  )
}

const chipBase =
  'inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-background px-3 text-xs font-medium shadow-sm transition-[background-color,color,transform] duration-150 hover:bg-muted/50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export interface FilterOption {
  value: string
  label: string
}

/** Chip button that opens a popover of checkbox rows (multi-select). */
export function FilterChip({
  label,
  options,
  selected,
  onChange,
  className,
}: {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (next: string[]) => void
  className?: string
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} className={cn(chipBase, 'min-w-[120px] justify-between', className)}>
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="truncate">{label}</span>
          {selected.length > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-bold tabular-nums text-primary">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] rounded-2xl p-0">
        <div className="max-h-[280px] overflow-y-auto p-1">
          {options.map((option) => {
            const checked = selected.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemcheckbox"
                aria-checked={checked}
                onClick={() => toggle(option.value)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60 hover:text-foreground',
                  checked ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                    checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent'
                  )}
                >
                  {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
                <span className="flex-1 truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Pill-shaped toggle with a small switch ("Read-only calls" style). */
export function ToggleChip({
  label,
  checked,
  onChange,
  className,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(chipBase, checked ? 'text-foreground' : 'text-muted-foreground', className)}
    >
      <span
        role="switch"
        aria-checked={checked}
        aria-hidden
        className={cn(
          'inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent p-0.5 transition-[background-color,box-shadow] duration-200',
          checked ? 'bg-primary' : 'bg-input'
        )}
      >
        <span
          className={cn(
            'block h-5 w-5 rounded-full bg-background shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </span>
      <span>{label}</span>
    </button>
  )
}
