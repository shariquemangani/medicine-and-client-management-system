'use client'

import type { LucideIcon } from 'lucide-react'
import type { MetricAccentKey } from '@/utils/theme'
import { CardHeader } from '@/components/shared/card-header'

export interface PatientFormSectionHeaderProps {
  accent: MetricAccentKey
  title: string
  /** @deprecated unused; kept so existing call sites keep compiling */
  arabicLabel?: string
  subtitle?: string
  icon: LucideIcon
  secondaryIcon?: LucideIcon
  actions?: React.ReactNode
  className?: string
}

/** Kept for existing call sites; renders the shared CardHeader. */
export function PatientFormSectionHeader({
  accent,
  title,
  subtitle,
  icon,
  secondaryIcon,
  actions,
  className,
}: PatientFormSectionHeaderProps) {
  return (
    <CardHeader
      accent={accent}
      title={title}
      description={subtitle}
      icon={icon}
      secondaryIcon={secondaryIcon}
      actions={actions}
      className={className}
    />
  )
}
