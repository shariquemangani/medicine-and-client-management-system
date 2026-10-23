"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  allowCustomValue?: boolean
  /** Accessible name; defaults to the placeholder (a combobox is not named by its content). */
  ariaLabel?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  emptyMessage = "No results found.",
  className,
  allowCustomValue = false,
  ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  // Find the selected option label
  const selectedOption = options.find((option) => option.value === value)
  
  // Handle custom value input
  const handleInputChange = (input: string) => {
    setSearchTerm(input)
    
    if (allowCustomValue && input && !options.some(option => 
      option.value.toLowerCase() === input.toLowerCase() || 
      option.label.toLowerCase() === input.toLowerCase()
    )) {
      // If custom values are allowed and the input doesn't match any option
      onChange(input)
    }
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={open}
          className={cn('clinic-form-control w-full justify-between text-left', className)}
        >
          {value ? (selectedOption?.label || value) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            onValueChange={handleInputChange}
            value={searchTerm}
          />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => {
                  onChange(option.value)
                  setSearchTerm("")
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
            {allowCustomValue && searchTerm && !options.some(option => 
              option.value.toLowerCase() === searchTerm.toLowerCase() || 
              option.label.toLowerCase() === searchTerm.toLowerCase()
            ) && (
              <CommandItem
                value={searchTerm}
                onSelect={() => {
                  onChange(searchTerm)
                  setOpen(false)
                }}
                className="text-primary"
              >
                <span className="mr-2">+</span>
                Add &quot;{searchTerm}&quot;
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

