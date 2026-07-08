'use client'

import { Combobox } from '@/components/ui/combobox'
import { advancedFieldTriggerClass } from '@/components/shared/form-field-layout'
import { cn } from '@/lib/utils'

export interface AdvancedSelectOption {
  value: string
  label: string
}

interface AdvancedSelectProps {
  value: string
  onChange: (value: string) => void
  options: AdvancedSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function AdvancedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  searchPlaceholder,
  emptyMessage = 'No results found.',
  className,
  disabled = false,
}: AdvancedSelectProps) {
  return (
    <Combobox
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      className={cn(advancedFieldTriggerClass, disabled && 'pointer-events-none opacity-60', className)}
    />
  )
}
