import * as React from 'react'
import { X, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxDisplay?: number
  emptyMessage?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  className,
  disabled = false,
  maxDisplay = 3,
  emptyMessage = 'No options found.',
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string) => {
    onChange(selected.filter(item => item !== value))
  }

  const selectedLabels = selected.map(value => {
    const option = options.find(option => option.value === value)
    return option ? option.label : value
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between min-h-10 hover:scale-[1] hover:border-gray-200',
            selected.length > 0 ? 'h-auto' : '',
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selected.length > 0 && (
              <>
                {selectedLabels.slice(0, maxDisplay).map(label => (
                  <Badge key={label} variant="default" className="mr-1 mb-1">
                    {label}
                  </Badge>
                ))}
                {selected.length > maxDisplay && (
                  <Badge variant="default" className="mb-1">
                    +{selected.length - maxDisplay} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white border-gray-200 shadow-xl rounded-xl overflow-hidden">
        <Command className="bg-white">
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            className="h-11"
          />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto p-2">
            {options.map(option => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
                className="cursor-pointer rounded-lg mb-1 last:mb-0 hover:bg-primary transition-colors"
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selected.includes(option.value)
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
        {selected.length > 0 && (
          <div className="border-t p-2 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selected.length} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="h-8 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
