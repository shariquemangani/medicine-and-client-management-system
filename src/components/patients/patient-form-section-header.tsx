'use client'

import type { LucideIcon } from 'lucide-react'
import type { MetricAccentKey } from '@/utils/theme'
import { cn } from '@/lib/utils'

export interface PatientFormSectionHeaderProps {
  accent: MetricAccentKey
  title: string
  arabicLabel?: string
  subtitle?: string
  icon: LucideIcon
  secondaryIcon?: LucideIcon
  actions?: React.ReactNode
  className?: string
}

export function PatientFormSectionHeader({
  accent,
  title,
  arabicLabel,
  subtitle,
  icon: Icon,
  secondaryIcon: SecondaryIcon,
  actions,
  className,
}: PatientFormSectionHeaderProps) {
  return (
    <div className={cn('clinic-form-section-header mb-4', className)} data-accent={accent}>
      <div className="flex items-start gap-3">
        <div className="clinic-form-section-header-icon" aria-hidden>
          <Icon className="h-4 w-4" strokeWidth={2.25} />
          {SecondaryIcon ? (
            <SecondaryIcon
              className="clinic-form-section-header-icon-secondary h-3.5 w-3.5"
              strokeWidth={2.25}
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              {arabicLabel ? (
                <p className="mt-0.5 text-xs text-muted-foreground" lang="ar" dir="rtl">
                  {arabicLabel}
                </p>
              ) : null}
              {subtitle ? (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2.5">{actions}</div> : null}
          </div>
        </div>
      </div>
      <div className="clinic-form-section-header-ornament mt-3" aria-hidden />
    </div>
  )
}
