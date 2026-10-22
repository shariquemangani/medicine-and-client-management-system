import * as React from 'react'
import { cn } from '@/lib/utils'
import { MeshAvatar } from '@/components/layout/profile-menu'

/** Scroll wrapper + base table. Use with <THead>, <Th>, <Tr>, <Td>. */
export function DataTable({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('sticky top-0 z-10 border-b border-border/70 bg-muted/95', className)} {...props} />
}

/** 11px bold uppercase column header. */
export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('border-b border-border/50 bg-card transition-colors duration-100 last:border-b-0 hover:bg-muted/40', className)}
      {...props}
    />
  )
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle text-foreground/85', className)} {...props} />
}

/** Avatar + name + muted secondary line (email / id). */
export function MemberCell({
  name,
  secondary,
  className,
}: {
  name: string
  secondary?: string
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <MeshAvatar name={name} className="h-8 w-8" />
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground">{name}</span>
        {secondary ? <span className="block truncate text-xs text-muted-foreground">{secondary}</span> : null}
      </span>
    </div>
  )
}

/** Small bordered pill (roles, sources) or soft status pill. */
export function Pill({
  children,
  tone = 'outline',
  className,
}: {
  children: React.ReactNode
  tone?: 'outline' | 'muted' | 'success' | 'danger'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs',
        tone === 'outline' && 'border-border text-foreground',
        tone === 'muted' && 'border-transparent bg-secondary text-secondary-foreground',
        tone === 'success' && 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        tone === 'danger' && 'border-transparent bg-destructive/15 text-destructive',
        className
      )}
    >
      {children}
    </span>
  )
}
