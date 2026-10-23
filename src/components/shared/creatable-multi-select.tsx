'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export interface CreatableMultiSelectOption {
  value: string
  label: string
}

interface CreatableMultiSelectProps {
  options: CreatableMultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  onCreateOption?: (label: string) => Promise<CreatableMultiSelectOption | null>
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  createLabel?: (term: string) => string
  className?: string
  disabled?: boolean
  /** When set, truncates visible badges and shows "+N more". Omit to show all selected. */
  maxDisplay?: number
  /** Accessible name; defaults to the placeholder (a combobox is not named by its content). */
  ariaLabel?: string
}

export function CreatableMultiSelect({
  options,
  selected,
  onChange,
  onCreateOption,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  createLabel = (term) => `Add "${term}"`,
  className,
  disabled = false,
  maxDisplay,
  ariaLabel,
}: CreatableMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [creating, setCreating] = React.useState(false)

  const optionMap = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const opt of options) map.set(opt.value, opt.label)
    for (const value of selected) {
      if (!map.has(value)) map.set(value, value)
    }
    return map
  }, [options, selected])

  const normalizedSearch = search.trim()
  const canCreate =
    Boolean(onCreateOption && normalizedSearch) &&
    !options.some(
      (o) =>
        o.label.toLowerCase() === normalizedSearch.toLowerCase() ||
        o.value.toLowerCase() === normalizedSearch.toLowerCase()
    ) &&
    !selected.some((v) => v.toLowerCase() === normalizedSearch.toLowerCase())

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleCreate = async () => {
    if (!onCreateOption || !normalizedSearch || creating) return
    setCreating(true)
    try {
      const created = await onCreateOption(normalizedSearch)
      if (created && !selected.includes(created.value)) {
        onChange([...selected, created.value])
      } else if (!created && !selected.includes(normalizedSearch)) {
        onChange([...selected, normalizedSearch])
      }
      setSearch('')
      setOpen(false)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'clinic-form-input h-auto min-h-10 w-full cursor-pointer justify-between font-normal hover:scale-100',
            className
          )}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 py-0.5">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              (maxDisplay != null ? selected.slice(0, maxDisplay) : selected).map((value) => (
                <Badge key={value} variant="secondary" className="font-normal">
                  {optionMap.get(value) ?? value}
                </Badge>
              ))
            )}
            {maxDisplay != null && selected.length > maxDisplay ? (
              <Badge variant="secondary">+{selected.length - maxDisplay} more</Badge>
            ) : null}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => toggle(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected.includes(option.value) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {canCreate ? (
                <CommandItem
                  value={`__create__${normalizedSearch}`}
                  onSelect={() => void handleCreate()}
                  className="cursor-pointer text-primary"
                >
                  {!creating && (
                    <Plus className="mr-2 h-4 w-4" />
)}
                  {createLabel(normalizedSearch)}
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
