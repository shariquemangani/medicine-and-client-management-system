'use client'

import * as React from 'react'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Current date constants for validation
const today = new Date()

// 6-month rolling window (past and future) default for selection
const defaultMinDate = new Date(today)
defaultMinDate.setMonth(defaultMinDate.getMonth() - 6)
defaultMinDate.setHours(0, 0, 0, 0)

const defaultMaxDate = new Date(today)
defaultMaxDate.setMonth(defaultMaxDate.getMonth() + 6)
defaultMaxDate.setHours(23, 59, 59, 999)

export interface DatePickerProps {
  date?: Date | undefined
  setDate?: (date: Date | undefined) => void
  dateRange?: { from?: Date; to?: Date }
  setDateRange?: (range: { from?: Date; to?: Date }) => void
  defaultValue?: Date | string
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  mode?: 'single' | 'range'
  className?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  minDate?: Date
  maxDate?: Date
  disabledDate?: (date: Date) => boolean
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      date,
      setDate,
      dateRange,
      setDateRange,
      defaultValue,
      value,
      onChange,
      mode = 'single',
      className,
      placeholder = 'Select date',
      disabled = false,
      required = false,
      minDate,
      maxDate,
      disabledDate,
    },
    ref
  ) => {
    // Resolve date boundaries (defaults to +/- 6 months)
    const minDateToUse = React.useMemo(() => {
      const base = minDate ? new Date(minDate) : new Date(defaultMinDate)
      base.setHours(0, 0, 0, 0)
      return base
    }, [minDate])

    const maxDateToUse = React.useMemo(() => {
      const base = maxDate ? new Date(maxDate) : new Date(defaultMaxDate)
      base.setHours(23, 59, 59, 999)
      return base
    }, [maxDate])

    const isOutsideWindow = React.useCallback(
      (checkDate: Date) => {
        if (checkDate < minDateToUse || checkDate > maxDateToUse) return true
        if (disabledDate && disabledDate(checkDate)) return true
        return false
      },
      [minDateToUse, maxDateToUse, disabledDate]
    )

    // Determine if component is controlled or uncontrolled
    const isControlled =
      value !== undefined || date !== undefined || dateRange !== undefined
    const isRangeMode = mode === 'range'

    const initialDate = React.useMemo(() => {
      if (isControlled && !isRangeMode) {
        return value || date
      }
      if (defaultValue) {
        return typeof defaultValue === 'string'
          ? new Date(defaultValue)
          : defaultValue
      }
      return undefined
    }, [isControlled, isRangeMode, value, date, defaultValue])

    const [internalDate, setInternalDate] = React.useState<Date | undefined>(
      initialDate
        ? typeof initialDate === 'string'
          ? new Date(initialDate)
          : initialDate
        : undefined
    )
    const [internalDateRange, setInternalDateRange] = React.useState<
      { from?: Date; to?: Date } | undefined
    >(isRangeMode ? dateRange || { from: undefined, to: undefined } : undefined)
    const [selectedYear, setSelectedYear] = React.useState<string>(() => {
      if (isRangeMode && dateRange?.from) {
        return dateRange.from.getFullYear().toString()
      }

      const initialMonth = initialDate || new Date()
      const dateObj =
        typeof initialMonth === 'string' ? new Date(initialMonth) : initialMonth
      return dateObj.getFullYear().toString()
    })

    const currentDate = !isRangeMode
      ? isControlled
        ? value || date
        : internalDate
      : undefined
    const currentDateRange = isRangeMode
      ? isControlled
        ? dateRange
        : internalDateRange
      : undefined

    const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
      if (isRangeMode && dateRange?.from) {
        return dateRange.from
      }

      const dateToUse = initialDate || new Date()
      const parsedDate =
        typeof dateToUse === 'string' ? new Date(dateToUse) : dateToUse

      // If the date is in the past, start from current date instead
      if (parsedDate < minDateToUse) {
        return minDateToUse
      }
      if (parsedDate > maxDateToUse) {
        return maxDateToUse
      }

      return parsedDate
    })

    const handleMonthChange = (month: Date) => {
      if (isOutsideWindow(month)) {
        setCurrentMonth(month < minDateToUse ? minDateToUse : maxDateToUse)
        return
      }
      setCurrentMonth(month)
    }

    // Update internal state when props change
    React.useEffect(() => {
      if (isControlled) {
        if (isRangeMode && dateRange) {
          setInternalDateRange(dateRange)
          if (dateRange.from) {
            setCurrentMonth(dateRange.from)
            setSelectedYear(dateRange.from.getFullYear().toString())
          }
        } else if (!isRangeMode) {
          const newDate = value || date
          setInternalDate(
            typeof newDate === 'string' ? new Date(newDate) : newDate
          )
          if (newDate) {
            const dateObj =
              typeof newDate === 'string' ? new Date(newDate) : newDate
            setCurrentMonth(dateObj)
            setSelectedYear(dateObj.getFullYear().toString())
          }
        }
      }
    }, [isControlled, isRangeMode, value, date, dateRange])

    // Update selected year when current month changes
    React.useEffect(() => {
      setSelectedYear(currentMonth.getFullYear().toString())
    }, [currentMonth])

    const handleDateChange = (newDate: Date | undefined) => {
      if (!isControlled) {
        setInternalDate(newDate)
      }

      // Call appropriate callback
      if (setDate) {
        setDate(newDate)
      }
      if (onChange) {
        onChange(newDate)
      }

      if (newDate) {
        setCurrentMonth(newDate)
      }
    }

    const handleDateRangeChange = (
      range: { from?: Date; to?: Date } | undefined
    ) => {
      if (!isControlled) {
        setInternalDateRange(range)
      }

      // Call appropriate callback
      if (setDateRange) {
        setDateRange(range || { from: undefined, to: undefined })
      }

      // Update current month to show the selected range
      if (range?.from) {
        setCurrentMonth(range.from)
      }
    }

    // Handle month navigation
    const handlePreviousMonth = () => {
      setCurrentMonth(prev => {
        const newDate = new Date(prev)
        newDate.setMonth(newDate.getMonth() - 1)
        return newDate < minDateToUse ? minDateToUse : newDate
      })
    }

    const handleNextMonth = () => {
      setCurrentMonth(prev => {
        const newDate = new Date(prev)
        newDate.setMonth(newDate.getMonth() + 1)
        return newDate > maxDateToUse ? maxDateToUse : newDate
      })
    }

    // Handle year navigation
    const handlePreviousYear = () => {
      setCurrentMonth(prev => {
        const newDate = new Date(prev)
        newDate.setFullYear(newDate.getFullYear() - 1)
        return newDate < minDateToUse ? minDateToUse : newDate
      })
    }

    const handleNextYear = () => {
      setCurrentMonth(prev => {
        const newDate = new Date(prev)
        newDate.setFullYear(newDate.getFullYear() + 1)
        return newDate > maxDateToUse ? maxDateToUse : newDate
      })
    }

    // Handle year selection
    const handleYearSelect = (year: string) => {
      setSelectedYear(year)
      setCurrentMonth(prev => {
        const newDate = new Date(prev)
        newDate.setFullYear(parseInt(year))
        if (newDate < minDateToUse) return minDateToUse
        if (newDate > maxDateToUse) return maxDateToUse
        return newDate
      })
    }

    return (
      <>
        {/* Hidden input for form compatibility */}
        <input
          ref={ref}
          type="hidden"
          value={
            currentDate
              ? typeof currentDate === 'string'
                ? currentDate
                : format(currentDate, 'yyyy-MM-dd')
              : ''
          }
          required={required}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              className={cn(
                'w-full justify-between text-left font-normal border-muted-foreground/20 bg-muted/30 hover:bg-muted/50 transition-all rounded-lg h-10 focus:ring-0 focus:ring-primary/30 focus:border-primary',
                !currentDate &&
                !currentDateRange?.from &&
                'text-muted-foreground',
                className
              )}
              disabled={disabled}
            >
              {isRangeMode ? (
                currentDateRange?.from ? (
                  <span className="text-foreground">
                    {currentDateRange.from &&
                      format(currentDateRange.from, 'MMM d, yyyy')}
                    {currentDateRange.to &&
                      currentDateRange.to !== currentDateRange.from && (
                        <> → {format(currentDateRange.to, 'MMM d, yyyy')}</>
                      )}
                  </span>
                ) : (
                  <span>{placeholder}</span>
                )
              ) : currentDate ? (
                <span className="text-foreground">
                  {format(
                    typeof currentDate === 'string'
                      ? new Date(currentDate)
                      : currentDate,
                    'PPP'
                  )}
                </span>
              ) : (
                <span>{placeholder}</span>
              )}
              <CalendarIcon className="h-4 w-4 shrink-0 text-[hsl(var(--metric-patients-text))]" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto border-[hsl(var(--glass-border))] bg-[hsl(var(--card))] p-0 shadow-lg"
            align="start"
          >
            <div className="rounded-lg p-4">
              {/* Enhanced navigation header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                {/* Left navigation group */}
                <div className="flex items-center space-x-2">
                  {/* Year previous */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePreviousYear}
                    disabled={currentMonth <= minDateToUse}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    <span className="sr-only">Previous year</span>
                  </Button>

                  {/* Month previous */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handlePreviousMonth}
                    disabled={currentMonth <= minDateToUse}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    <span className="sr-only">Previous month</span>
                  </Button>
                </div>

                {/* Center display */}
                <div className="flex items-center space-x-3">
                  <div className="text-lg font-semibold text-primary">
                    {format(currentMonth, 'MMMM')}
                  </div>
                  <Select value={selectedYear} onValueChange={handleYearSelect}>
                    <SelectTrigger className="w-20 h-8 px-2 border-0 bg-transparent hover:bg-primary/5 text-primary font-semibold text-lg shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from(
                        {
                          length:
                            maxDateToUse.getFullYear() -
                            minDateToUse.getFullYear() +
                            1,
                        },
                        (_, i) => {
                          const year = minDateToUse.getFullYear() + i
                          return (
                            <SelectItem
                              key={year}
                              value={year.toString()}
                              className="text-center font-medium"
                            >
                              {year}
                            </SelectItem>
                          )
                        }
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Right navigation group */}
                <div className="flex items-center space-x-2">
                  {/* Month next */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
                    onClick={handleNextMonth}
                    disabled={currentMonth >= maxDateToUse}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                    <span className="sr-only">Next month</span>
                  </Button>

                  {/* Year next */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
                    onClick={handleNextYear}
                    disabled={currentMonth >= maxDateToUse}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                    <span className="sr-only">Next year</span>
                  </Button>
                </div>
              </div>

              {isRangeMode ? (
                <Calendar
                  mode="range"
                  month={currentMonth}
                  onMonthChange={handleMonthChange}
                  selected={
                    currentDateRange?.from
                      ? { from: currentDateRange.from, to: currentDateRange.to }
                      : undefined
                  }
                  onSelect={handleDateRangeChange}
                  disabled={date => {
                    return isOutsideWindow(date)
                  }}
                  initialFocus
                  modifiersStyles={{
                    today: {
                      backgroundColor: 'hsl(var(--metric-patients) / 0.85)',
                      color: 'hsl(var(--primary-foreground))',
                    },
                    selected: {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      borderRadius: '9999px',
                    },
                  }}
                  className="border-0 mt-0 pt-0"
                  classNames={{
                    months: 'flex flex-col space-y-0', // Remove vertical spacing
                    month: 'space-y-0', // Remove vertical spacing
                    caption: 'hidden', // Completely hide default caption
                    caption_label: 'hidden', // Hide caption label
                    nav: 'hidden', // Hide default nav buttons
                    table: 'w-full border-collapse',
                    head_row: 'flex justify-between w-full',
                    head_cell:
                      'text-muted-foreground w-9 font-normal text-[0.8rem] flex items-center justify-center',
                    row: 'flex w-full justify-between mt-1',
                    cell: 'text-center p-0 relative flex items-center justify-center focus-within:relative focus-within:z-20 h-[36px]',
                    day: 'h-[36px] w-[36px] p-0 font-normal aria-selected:opacity-100 flex items-center justify-center hover:bg-muted/70',
                    day_selected:
                      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full w-[36px] h-[36px] flex items-center justify-center',
                    day_today:
                      'bg-[hsl(var(--metric-patients)/0.85)] text-primary-foreground rounded-full w-[36px] h-[36px] flex items-center justify-center',
                    day_outside: 'text-muted-foreground opacity-50',
                    day_disabled: 'text-muted-foreground opacity-50',
                    day_range_middle:
                      'aria-selected:bg-accent aria-selected:text-accent-foreground',
                    day_hidden: 'invisible',
                  }}
                />
              ) : (
                <Calendar
                  mode="single"
                  month={currentMonth}
                  onMonthChange={handleMonthChange}
                  selected={
                    currentDate
                      ? typeof currentDate === 'string'
                        ? new Date(currentDate)
                        : currentDate
                      : undefined
                  }
                  onSelect={handleDateChange}
                  disabled={date => {
                    return isOutsideWindow(date)
                  }}
                  initialFocus
                  modifiersStyles={{
                    today: {
                      backgroundColor: 'hsl(var(--metric-patients) / 0.85)',
                      color: 'hsl(var(--primary-foreground))',
                    },
                    selected: {
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      borderRadius: '9999px',
                    },
                  }}
                  className="border-0 mt-0 pt-0"
                  classNames={{
                    months: 'flex flex-col space-y-0', // Remove vertical spacing
                    month: 'space-y-0', // Remove vertical spacing
                    caption: 'hidden', // Completely hide default caption
                    caption_label: 'hidden', // Hide caption label
                    nav: 'hidden', // Hide default nav buttons
                    table: 'w-full border-collapse',
                    head_row: 'flex justify-between w-full',
                    head_cell:
                      'text-muted-foreground w-9 font-normal text-[0.8rem] flex items-center justify-center',
                    row: 'flex w-full justify-between mt-1',
                    cell: 'text-center p-0 relative flex items-center justify-center focus-within:relative focus-within:z-20 h-[36px]',
                    day: 'h-[36px] w-[36px] p-0 font-normal aria-selected:opacity-100 flex items-center justify-center hover:bg-muted/70',
                    day_selected:
                      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full w-[36px] h-[36px] flex items-center justify-center',
                    day_today:
                      'bg-[hsl(var(--metric-patients)/0.85)] text-primary-foreground rounded-full w-[36px] h-[36px] flex items-center justify-center',
                    day_outside: 'text-muted-foreground opacity-50',
                    day_disabled: 'text-muted-foreground opacity-50',
                    day_range_middle:
                      'aria-selected:bg-accent aria-selected:text-accent-foreground',
                    day_hidden: 'invisible',
                  }}
                />
              )}
            </div>
          </PopoverContent>
        </Popover>
      </>
    )
  }
)

DatePicker.displayName = 'DatePicker'
