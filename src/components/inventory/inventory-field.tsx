'use client'

import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

interface InventoryFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: ReactNode
  optional?: boolean
  className?: string
  children: ReactNode
}

/** Label + control + inline hint/error used by every inventory dialog. */
export function InventoryField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  className,
  children,
}: InventoryFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? <span className="ml-1 text-xs font-normal text-muted-foreground">({t('common.optional').toLowerCase()})</span> : null}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export const invalidInputClass = 'border-red-500/60 focus-visible:ring-red-500/30'
