'use client'

import { ChevronLeft, BookOpen } from 'lucide-react'
import type { Medicine } from '@/types'
import { Button } from '@/components/ui/button'
import { getTranslatedClassName } from '@/lib/patient-display'
import { mainCardShadow } from '@/utils/theme'
import { cn } from '@/lib/utils'

type ClassDetail = Medicine & {
  patients?: { id: string }[]
  patientCount?: number
}

interface MedicineDetailHeaderProps {
  cls: ClassDetail
  onBack: () => void
}

export function MedicineDetailHeader({ cls, onBack }: MedicineDetailHeaderProps) {
  const patientCount = cls.patientCount ?? cls.patientIds?.length ?? 0

  return (
    <div className={cn('medicine-detail-header relative rounded-2xl border p-4 sm:p-5', mainCardShadow)}>
      <div className="medicine-detail-header-mesh pointer-events-none overflow-hidden rounded-[inherit]" aria-hidden />
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={onBack}
            aria-label={'Back'}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="classes-avatar flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="classes-accent-pill">{'Medicine profile'}</span>
              <span className="classes-count-pill text-xs">
                {patientCount} {'Patients'}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {getTranslatedClassName(cls.name)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {'Grade'} {cls.grade} · {'Section'} {cls.section} ·{' '}
              {'Homeroom'}: {cls.homeroomStaffName}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm dark:bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground">{'Schedule'}</p>
          <p className="font-medium text-foreground">{cls.scheduleSummary || 'No schedule set'}</p>
        </div>
      </div>
    </div>
  )
}
