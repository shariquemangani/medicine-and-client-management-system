'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  clinicFormButtonClass,
  clinicFormControlClass,
} from '@/components/shared/form-field-layout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollPickerColumn } from '@/components/shared/scroll-picker-column'
import {
  buildIsoDate,
  getDayOptions,
  getMonthOptions,
  isTodayIsoDate,
  parseIsoDateParts,
  todayIsoDate,
} from '@/lib/date-select-utils'
import {
  MAX_ENROLLMENT_YEAR,
  MIN_ENROLLMENT_YEAR,
} from '@/data/enrollment-years'
import { cn } from '@/lib/utils'

export interface AdvancedDateSelectProps {
  value: string
  onChange: (isoDate: string) => void
  className?: string
  minYear?: number
  maxYear?: number
  disabled?: boolean
  showToday?: boolean
}

export function formatEnrollmentDateDisplay(value: string) {
  if (!value) return ''
  return format(new Date(`${value}T12:00:00`), 'MMM d, yyyy')
}

export function AdvancedDateSelect({
  value,
  onChange,
  className,
  minYear = MIN_ENROLLMENT_YEAR,
  maxYear = MAX_ENROLLMENT_YEAR,
  disabled = false,
  showToday = true,
}: AdvancedDateSelectProps) {
  const [open, setOpen] = React.useState(false)

  const committed = React.useMemo(() => {
    const parsed = parseIsoDateParts(value)
    if (parsed) return parsed
    const today = parseIsoDateParts(todayIsoDate())!
    return today
  }, [value])

  const [draftDay, setDraftDay] = React.useState(String(committed.day).padStart(2, '0'))
  const [draftMonth, setDraftMonth] = React.useState(String(committed.month).padStart(2, '0'))
  const [draftYear, setDraftYear] = React.useState(String(committed.year))

  React.useEffect(() => {
    setDraftDay(String(committed.day).padStart(2, '0'))
    setDraftMonth(String(committed.month).padStart(2, '0'))
    setDraftYear(String(committed.year))
  }, [committed.day, committed.month, committed.year, open])

  const years = React.useMemo(() => {
    const list: number[] = []
    for (let year = maxYear; year >= minYear; year--) list.push(year)
    return list
  }, [minYear, maxYear])

  const draftYearNum = Number(draftYear)
  const draftMonthNum = Number(draftMonth)

  const dayOptions = React.useMemo(
    () => getDayOptions(draftYearNum, draftMonthNum),
    [draftYearNum, draftMonthNum]
  )

  const yearItems = years.map((year) => ({ value: String(year), label: String(year) }))
  const monthItems = getMonthOptions().map((month) => ({
    value: month.value,
    label: month.label.slice(0, 3),
  }))

  const isToday = isTodayIsoDate(value)

  const applyDraft = () => {
    onChange(buildIsoDate(draftYearNum, draftMonthNum, Number(draftDay)))
    setOpen(false)
  }

  const handleToday = () => {
    onChange(todayIsoDate())
    setOpen(false)
  }

  const handleMonthChange = (month: string) => {
    setDraftMonth(month)
    const maxDay = getDayOptions(draftYearNum, Number(month)).length
    if (Number(draftDay) > maxDay) {
      setDraftDay(String(maxDay).padStart(2, '0'))
    }
  }

  const handleYearChange = (year: string) => {
    setDraftYear(year)
    const maxDay = getDayOptions(Number(year), draftMonthNum).length
    if (Number(draftDay) > maxDay) {
      setDraftDay(String(maxDay).padStart(2, '0'))
    }
  }

  return (
    <div
      className={cn(
        'grid w-full items-stretch gap-2',
        showToday ? 'grid-cols-[7fr_3fr]' : 'grid-cols-1',
        className
      )}
    >
      <div className="min-w-0">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                clinicFormControlClass,
                'h-10 w-full min-w-0 justify-start gap-2 px-3 font-medium',
                !value && 'text-muted-foreground'
              )}
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-[hsl(var(--metric-medicines))]" aria-hidden />
              <span className="truncate text-xs sm:text-sm">
                {value ? formatEnrollmentDateDisplay(value) : 'Select date'}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <DialogHeader className="space-y-1 border-b border-border px-6 py-5 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--metric-medicines)/0.12)]">
                <CalendarDays className="h-4 w-4 text-[hsl(var(--metric-medicines))]" aria-hidden />
              </div>
              <div>
                <DialogTitle className="text-base">{'Select enrollment date'}</DialogTitle>
                <DialogDescription className="text-xs">
                  {'Pick day, month and year'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5">
            <div className="flex items-stretch gap-2">
              <ScrollPickerColumn
                label={'Day'}
                items={dayOptions}
                value={draftDay}
                onSelect={setDraftDay}
              />
              <ScrollPickerColumn
                label={'Month'}
                items={monthItems}
                value={draftMonth}
                onSelect={handleMonthChange}
              />
              <ScrollPickerColumn
                label={'Year'}
                items={yearItems}
                value={draftYear}
                onSelect={handleYearChange}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="clinic-hero-btn h-9 rounded-xl px-4 text-xs font-semibold"
              onClick={() => setOpen(false)}
            >
              {'Cancel'}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-xl px-5 text-xs font-semibold"
              onClick={applyDraft}
            >
              {'Set date'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>

      {showToday ? (
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-pressed={isToday}
          data-active={isToday ? 'true' : 'false'}
          className={cn(
            clinicFormButtonClass,
            'h-10 w-full px-3 text-xs font-semibold transition-colors',
            isToday && [
              'clinic-form-control--active',
              'border-[hsl(var(--metric-medicines))] bg-[hsl(var(--metric-medicines))] text-white',
              'hover:border-[hsl(var(--metric-medicines))] hover:bg-[hsl(var(--metric-medicines)/0.9)] hover:text-white',
            ]
          )}
          onClick={handleToday}
        >
          {'Today'}
        </Button>
      ) : null}
    </div>
  )
}
