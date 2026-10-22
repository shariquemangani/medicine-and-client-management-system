import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Standard surface for every block on a page (summary strips, toolbars, tables, forms).
 * 20px radius, 1px border, soft inner highlight; colours come from the theme tokens.
 */
export function SectionCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-border bg-card/90 text-card-foreground',
        'shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06),0_1px_2px_hsl(0_0%_0%/0.12)]',
        className
      )}
      {...props}
    />
  )
}

interface SectionCardHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/** Card header: icon + small bold title + muted description, optional actions, bottom border. */
export function SectionCardHeader({ title, description, icon, actions, className }: SectionCardHeaderProps) {
  return (
    <header
      className={cn('flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6', className)}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span> : null}
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? <p className="text-sm leading-5 text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}

/** Compact strip card: icon + title + muted subtitle on the left, an action on the right. */
export function SummaryStrip({
  icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <SectionCard className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
    </SectionCard>
  )
}
