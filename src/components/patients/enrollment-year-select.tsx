'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getEnrollmentYearOptions } from '@/data/enrollment-years'
import { cn } from '@/lib/utils'

interface EnrollmentYearSelectProps {
  value: number
  onChange: (year: number) => void
  className?: string
  placeholder?: string
  id?: string
}

export function EnrollmentYearSelect({
  value,
  onChange,
  className,
  placeholder,
  id,
}: EnrollmentYearSelectProps) {
  const years = getEnrollmentYearOptions()

  return (
    <Select
      value={String(value)}
      onValueChange={(next) => onChange(Number(next))}
    >
      <SelectTrigger id={id} className={cn('clinic-form-input', className)}>
        <SelectValue placeholder={placeholder ?? 'Select enrollment year'} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
