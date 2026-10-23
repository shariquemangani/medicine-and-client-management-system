'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
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
import { cn } from '@/lib/utils'

export interface AdvancedTimeSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const hour = String(i + 1).padStart(2, '0')
  return { value: hour, label: hour }
})

const MINUTES = Array.from({ length: 12 }, (_, i) => {
  const minute = String(i * 5).padStart(2, '0')
  return { value: minute, label: minute }
})

const PERIODS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
]

function parseTimeValue(value?: string) {
  const match = value?.match(/^(\d{2}):(\d{2})\s(AM|PM)$/)
  if (!match) {
    return { hour: '09', minute: '00', period: 'AM' }
  }
  return { hour: match[1], minute: match[2], period: match[3] }
}

function buildTimeValue(hour: string, minute: string, period: string) {
  return `${hour}:${minute} ${period}`
}

export function AdvancedTimeSelect({
  value,
  onChange,
  className,
  disabled = false,
  placeholder,
}: AdvancedTimeSelectProps) {
  const [open, setOpen] = React.useState(false)
  const parsed = React.useMemo(() => parseTimeValue(value), [value])

  const [draftHour, setDraftHour] = React.useState(parsed.hour)
  const [draftMinute, setDraftMinute] = React.useState(parsed.minute)
  const [draftPeriod, setDraftPeriod] = React.useState(parsed.period)

  React.useEffect(() => {
    setDraftHour(parsed.hour)
    setDraftMinute(parsed.minute)
    setDraftPeriod(parsed.period)
  }, [parsed.hour, parsed.minute, parsed.period, open])

  const applyDraft = () => {
    onChange(buildTimeValue(draftHour, draftMinute, draftPeriod))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            clinicFormControlClass,
            'justify-start gap-2 px-3 font-medium',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Clock className="h-4 w-4 shrink-0 text-[hsl(var(--metric-medicines))]" aria-hidden />
          <span className="truncate text-xs sm:text-sm">
            {value || placeholder || 'Select time'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="space-y-1 border-b border-border px-6 py-5 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--metric-medicines)/0.12)]">
              <Clock className="h-4 w-4 text-[hsl(var(--metric-medicines))]" aria-hidden />
            </div>
            <div>
              <DialogTitle className="text-base">{'Select school / college timing'}</DialogTitle>
              <DialogDescription className="text-xs">
                {'Pick hour, minute and period'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          <div className="flex items-stretch gap-2">
            <ScrollPickerColumn
              label={'Hour'}
              items={HOURS}
              value={draftHour}
              onSelect={setDraftHour}
            />
            <ScrollPickerColumn
              label={'Minute'}
              items={MINUTES}
              value={draftMinute}
              onSelect={setDraftMinute}
            />
            <ScrollPickerColumn
              label={'Period'}
              items={PERIODS}
              value={draftPeriod}
              onSelect={setDraftPeriod}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(clinicFormButtonClass, 'h-9 rounded-xl px-4 text-xs font-semibold')}
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
            {'Set time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export interface AdvancedTimeRangeSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

const MINUTES_HALF = [
  { value: '00', label: '00' },
  { value: '30', label: '30' },
]

interface TimeSlot {
  hour: string
  minute: string
  period: string
}

const DEFAULT_START: TimeSlot = { hour: '09', minute: '00', period: 'AM' }
const DEFAULT_END: TimeSlot = { hour: '05', minute: '00', period: 'PM' }

function parseTimeSlotToken(token: string): TimeSlot {
  const withMinutes = token.trim().match(/^(\d{2}):(\d{2})\s(AM|PM)$/)
  if (withMinutes) {
    return {
      hour: withMinutes[1],
      minute: withMinutes[2] === '30' ? '30' : '00',
      period: withMinutes[3],
    }
  }

  const legacy = token.trim().match(/^(\d{2})\s(AM|PM)$/)
  if (legacy) {
    return { hour: legacy[1], minute: '00', period: legacy[2] }
  }

  return DEFAULT_START
}

function parseTimeRange(value?: string): { start: TimeSlot; end: TimeSlot } {
  if (!value?.includes(' - ')) {
    return { start: DEFAULT_START, end: DEFAULT_END }
  }

  const [startStr, endStr] = value.split(' - ')
  if (!startStr?.trim() || !endStr?.trim()) {
    return { start: DEFAULT_START, end: DEFAULT_END }
  }

  return {
    start: parseTimeSlotToken(startStr),
    end: parseTimeSlotToken(endStr),
  }
}

function formatTimeSlot(slot: TimeSlot) {
  if (slot.minute === '30') {
    return `${slot.hour}:${slot.minute} ${slot.period}`
  }
  return `${slot.hour} ${slot.period}`
}

function buildTimeRange(start: TimeSlot, end: TimeSlot) {
  return `${formatTimeSlot(start)} - ${formatTimeSlot(end)}`
}

function TimeSlotPickers({
  label,
  slot,
  onChange,
}: {
  label: string
  slot: TimeSlot
  onChange: (next: TimeSlot) => void
}) {

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--metric-medicines))]">
        {label}
      </p>
      <div className="flex items-stretch gap-2">
        <ScrollPickerColumn
          label={'Hour'}
          items={HOURS}
          value={slot.hour}
          onSelect={(hour) => onChange({ ...slot, hour })}
        />
        <ScrollPickerColumn
          label={'Minute'}
          items={MINUTES_HALF}
          value={slot.minute}
          onSelect={(minute) => onChange({ ...slot, minute })}
        />
        <ScrollPickerColumn
          label={'Period'}
          items={PERIODS}
          value={slot.period}
          onSelect={(period) => onChange({ ...slot, period })}
        />
      </div>
    </div>
  )
}

export function AdvancedTimeRangeSelect({
  value,
  onChange,
  className,
  disabled = false,
  placeholder,
}: AdvancedTimeRangeSelectProps) {
  const [open, setOpen] = React.useState(false)
  const parsed = React.useMemo(() => parseTimeRange(value), [value])

  const [draftStart, setDraftStart] = React.useState(parsed.start)
  const [draftEnd, setDraftEnd] = React.useState(parsed.end)

  React.useEffect(() => {
    setDraftStart(parsed.start)
    setDraftEnd(parsed.end)
  }, [parsed.start, parsed.end, open])

  const applyDraft = () => {
    onChange(buildTimeRange(draftStart, draftEnd))
    setOpen(false)
  }

  const displayValue = value || buildTimeRange(DEFAULT_START, DEFAULT_END)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            clinicFormControlClass,
            'justify-start gap-2 px-3 font-medium',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Clock className="h-4 w-4 shrink-0 text-[hsl(var(--metric-medicines))]" aria-hidden />
          <span className="truncate text-xs sm:text-sm">
            {value || placeholder || displayValue}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="space-y-1 border-b border-border px-6 py-5 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--metric-medicines)/0.12)]">
              <Clock className="h-4 w-4 text-[hsl(var(--metric-medicines))]" aria-hidden />
            </div>
            <div>
              <DialogTitle className="text-base">{'Select school / college timing'}</DialogTitle>
              <DialogDescription className="text-xs">
                {'Pick start and end time'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-start gap-3 px-6 py-5">
          <TimeSlotPickers
            label={'Start'}
            slot={draftStart}
            onChange={setDraftStart}
          />
          <div className="flex shrink-0 items-center self-center pt-8 text-sm font-semibold text-muted-foreground">
            –
          </div>
          <TimeSlotPickers
            label={'End'}
            slot={draftEnd}
            onChange={setDraftEnd}
          />
        </div>

        <div className="border-t border-border px-6 py-3">
          <p className="text-center text-sm font-semibold text-foreground">
            {buildTimeRange(draftStart, draftEnd)}
          </p>
        </div>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(clinicFormButtonClass, 'h-9 rounded-xl px-4 text-xs font-semibold')}
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
            {'Set time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
