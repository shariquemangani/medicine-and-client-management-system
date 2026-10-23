import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import type { MetricAccentKey } from '@/utils/theme'
import { cn } from '@/lib/utils'

export interface CardHeaderProps {
  title: string
  description?: string
  /** A lucide icon component (preferred) or any element; rendered inside the coloured tile. */
  icon: LucideIcon | React.ReactElement
  /** Small second icon in the tile corner (e.g. a calendar on a "details" tile). */
  secondaryIcon?: LucideIcon
  /** Colour of the tile and the divider line. */
  accent?: MetricAccentKey
  actions?: React.ReactNode
  /** Show the thin ornament line under the header (forms). Default true. */
  ornament?: boolean
  className?: string
}

/**
 * The one card header used everywhere (form sections, table cards, settings panels):
 * a 36px accent-coloured icon tile, a small bold title, a muted description and optional actions.
 */
export function CardHeader({
  title,
  description,
  icon,
  secondaryIcon: SecondaryIcon,
  accent = 'patients',
  actions,
  ornament = true,
  className,
}: CardHeaderProps) {
  const iconNode = React.isValidElement(icon) ? (
    icon
  ) : (
    React.createElement(icon as LucideIcon, { className: 'h-4 w-4', strokeWidth: 2.25 })
  )

  return (
    <div className={cn('clinic-form-section-header mb-3', className)} data-accent={accent}>
      <div className="flex items-center gap-3">
        <div className="clinic-form-section-header-icon" aria-hidden>
          {iconNode}
          {SecondaryIcon ? (
            <SecondaryIcon className="clinic-form-section-header-icon-secondary h-3 w-3" strokeWidth={2.25} />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight text-foreground">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </div>
      {ornament ? <div className="clinic-form-section-header-ornament mt-2.5" aria-hidden /> : null}
    </div>
  )
}
