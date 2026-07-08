'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Video, Phone } from 'lucide-react'

interface ScheduleItem {
  time: string
  patient: string
  type: string
  duration: string
  color: string
}

interface ScheduleListProps {
  schedules: ScheduleItem[]
  onStartCall?: (appointmentId: string, patientId: string) => void
}

export function ScheduleList({ schedules, onStartCall }: ScheduleListProps) {
  return (
    <>
      {schedules.map((schedule, index) => (
        <div key={index} className="flex items-start gap-4 py-2">
          <div className="w-16 text-sm text-muted-foreground font-medium">
            {schedule.time}
          </div>
          <div className="flex flex-col items-center">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: schedule.color }}
            />
            {index < schedules.length - 1 && (
              <div className="w-px h-8 bg-border mt-2" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {schedule.patient}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="px-3 py-1 text-[10px] rounded-[5px] font-medium text-white"
                    style={{ backgroundColor: schedule.color + '30', color: schedule.color }}
                  >
                    {schedule.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {schedule.duration}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  
                  aria-label="Message"
                >
                  <Video className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                 
                  aria-label="Phone"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                variant="secondary"

                  onClick={() =>
                    onStartCall?.(`ap-${index + 1}`, `c-${index + 1}`)
                  }
                >
                  Start call
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
