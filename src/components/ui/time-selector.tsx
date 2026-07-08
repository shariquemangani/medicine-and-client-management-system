'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TimeSelectorProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
  placeholder?: string
  id?: string
}

export function TimeSelector({
  value,
  onChange,
  className,
  placeholder = '00:00 AM',
  id,
}: TimeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Parse initial value (expected format "HH:MM AM/PM")
  const [hour, setHour] = React.useState('')
  const [minute, setMinute] = React.useState('')
  const [period, setPeriod] = React.useState('')

  React.useEffect(() => {
    if (value) {
      const match = value.match(/(\d{2}):(\d{2})\s(AM|PM)/)
      if (match) {
        setHour(match[1])
        setMinute(match[2])
        setPeriod(match[3])
      }
    } else {
      setHour('')
      setMinute('')
      setPeriod('')
    }
  }, [value])

  const handleTimeChange = (h: string, m: string, p: string) => {
    if (h && m && p && onChange) {
      onChange(`${h}:${m} ${p}`)
    }
  }

  const hours = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, '0')
  )
  const minutes = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, '0')
  )
  const periods = ['AM', 'PM']

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            'w-full justify-between text-left font-medium border-gray-200 hover:border-gray-300 transition-all rounded-xl h-10 px-3 flex items-center gap-2 outline-none',
            !value && 'text-gray-400',
            className
          )}
        >
          <span className="text-xs">{value || placeholder}</span>
          <Clock className="w-4 h-4 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0 border-0 shadow-2xl rounded-[32px] overflow-hidden"
        align="start"
      >
        <div className="bg-white p-6">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">
                Select Time
              </p>
              <p className="text-[10px] font-medium text-gray-400 mt-1">
                Pick hour, minute and period
              </p>
            </div>
          </div>

          <div className="flex gap-2 h-[220px]">
            {/* Hours Column */}
            <ScrollArea className="flex-1 h-full rounded-2xl bg-gray-50/50 border border-gray-100">
              <div className="p-1.5 space-y-1">
                <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center py-2 sticky top-0 bg-[#F9FAFB] z-10">
                  Hour
                </div>
                {hours.map(h => (
                  <Button
                    key={h}
                    variant="ghost"
                    className={cn(
                      'w-full h-10 text-xs font-bold transition-all rounded-xl',
                      hour === h
                        ? 'bg-[#0F172A] text-white hover:bg-[#0F172A]/90 shadow-md'
                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    )}
                    onClick={() => {
                      setHour(h)
                      handleTimeChange(h, minute || '00', period || 'AM')
                    }}
                  >
                    {h}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Minutes Column */}
            <ScrollArea className="flex-1 h-full rounded-2xl bg-gray-50/50 border border-gray-100">
              <div className="p-1.5 space-y-1">
                <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center py-2 sticky top-0 bg-[#F9FAFB] z-10">
                  Min
                </div>
                {minutes.map(m => (
                  <Button
                    key={m}
                    variant="ghost"
                    className={cn(
                      'w-full h-10 text-xs font-bold transition-all rounded-xl',
                      minute === m
                        ? 'bg-[#0F172A] text-white hover:bg-[#0F172A]/90 shadow-md'
                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    )}
                    onClick={() => {
                      setMinute(m)
                      handleTimeChange(hour || '12', m, period || 'AM')
                    }}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Period Column */}
            <ScrollArea className="flex-1 h-full rounded-2xl bg-gray-50/50 border border-gray-100">
              <div className="p-1.5 space-y-1">
                <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center py-2 sticky top-0 bg-[#F9FAFB] z-10">
                  Prd
                </div>
                {periods.map(p => (
                  <Button
                    key={p}
                    variant="ghost"
                    className={cn(
                      'w-full h-10 text-xs font-bold transition-all rounded-xl',
                      period === p
                        ? 'bg-[#0F172A] text-white hover:bg-[#0F172A]/90 shadow-md'
                        : 'text-gray-600 hover:bg-white hover:shadow-sm'
                    )}
                    onClick={() => {
                      setPeriod(p)
                      handleTimeChange(hour || '12', minute || '00', p)
                    }}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-4 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-9 px-6 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:opacity-90 shadow-lg shadow-gray-200"
              onClick={() => setIsOpen(false)}
            >
              Set Time
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
