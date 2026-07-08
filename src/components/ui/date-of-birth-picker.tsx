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

export interface DateOfBirthPickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  disabled?: boolean
  required?: boolean
}

const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11, so add 1
const currentDay = currentDate.getDate()

const years = Array.from({ length: 100 }, (_, i) => {
  const year = currentYear - i
  return { value: year.toString(), label: year.toString() }
})

const getDaysInMonth = (month: string, year: string): number => {
  if (!month || !year) return 31

  // If it's the current year and current month, return current day
  if (parseInt(year) === currentYear && parseInt(month) === currentMonth) {
    return currentDay
  }

  // Otherwise return the full days in the month
  return new Date(parseInt(year), parseInt(month), 0).getDate()
}

const getAvailableMonths = (year: string): typeof months => {
  if (!year || parseInt(year) < currentYear) {
    return months // All months available for past years
  }

  if (parseInt(year) === currentYear) {
    // Only show months up to current month for current year
    return months.slice(0, currentMonth)
  }

  return months // Future years should show all months (though unlikely for DOB)
}

const days = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1
  return { value: day.toString().padStart(2, '0'), label: day.toString() }
})

export function DateOfBirthPicker({
  date,
  setDate,
  className,
  disabled = false,
  required = false,
}: DateOfBirthPickerProps) {
  const [month, setMonth] = React.useState<string>(
    date ? (date.getMonth() + 1).toString().padStart(2, '0') : ''
  )
  const [year, setYear] = React.useState<string>(
    date ? date.getFullYear().toString() : ''
  )
  const [day, setDay] = React.useState<string>(
    date ? date.getDate().toString().padStart(2, '0') : ''
  )

  // Sync internal state when date prop changes
  React.useEffect(() => {
    if (date) {
      setMonth((date.getMonth() + 1).toString().padStart(2, '0'))
      setYear(date.getFullYear().toString())
      setDay(date.getDate().toString().padStart(2, '0'))
    } else {
      setMonth('')
      setYear('')
      setDay('')
    }
  }, [date])

  const availableMonths = React.useMemo(() => {
    return getAvailableMonths(year)
  }, [year])

  const availableDays = React.useMemo(() => {
    const maxDays = getDaysInMonth(month, year)
    return days.slice(0, maxDays)
  }, [month, year])

  // Update date when any field changes
  React.useEffect(() => {
    if (month && year && day) {
      const newDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      )
      if (!isNaN(newDate.getTime())) {
        setDate(newDate)
      }
    } else {
      setDate(undefined)
    }
  }, [month, year, day])

  // Reset selections when year changes
  React.useEffect(() => {
    if (year) {
      // Check if current month is valid for the new year
      const validMonths = getAvailableMonths(year)
      const isMonthValid = month && validMonths.some(m => m.value === month)
      if (!isMonthValid) {
        setMonth('')
        setDay('')
      }
    } else {
      // Year was cleared, reset everything
      setMonth('')
      setDay('')
    }
  }, [year])

  // Reset day when month changes or becomes invalid
  React.useEffect(() => {
    if (month && year && day) {
      const maxDays = getDaysInMonth(month, year)
      const dayNum = parseInt(day)
      if (dayNum > maxDays) {
        setDay('')
      }
    } else if (!month) {
      // Month was cleared, reset day
      setDay('')
    }
  }, [month, year, day])

  // Reset day if it's invalid for the selected month/year
  React.useEffect(() => {
    if (month && year && day) {
      const maxDays = getDaysInMonth(month, year)
      const dayNum = parseInt(day)
      if (dayNum > maxDays) {
        setDay('')
      }
    }
  }, [month, year, day])

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      <Select value={year} onValueChange={setYear} disabled={disabled}>
        <SelectTrigger className="h-10 border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition-all rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y.value} value={y.value}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={month} onValueChange={setMonth} disabled={disabled || !year}>
        <SelectTrigger className="h-10 border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition-all rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {availableMonths.map(m => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={day} onValueChange={setDay} disabled={disabled || !month}>
        <SelectTrigger className="h-10 border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition-all rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {availableDays.map(d => (
            <SelectItem key={d.value} value={d.value}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
