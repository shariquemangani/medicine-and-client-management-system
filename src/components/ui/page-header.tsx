'use client'

import { ReactNode } from 'react'
import { BackButton } from './back-button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  onBackClick?: () => void
  className?: string
  loading?: boolean
  showBackButton?: boolean
}

export function PageHeader({
  title,
  description,
  children,
  onBackClick,
  className,
  loading = false,
  showBackButton,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-background p-6 border-none shadow-[0_8px_32px_rgba(15,23,42,0.08)]',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {(showBackButton !== undefined ? showBackButton : !!onBackClick) && (
            <BackButton onClick={onBackClick} loading={loading} />
          )}
          <div>
            {typeof title === 'string' ? (
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            ) : (
              title
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-3 ml-auto">{children}</div>
        )}
      </div>
    </div>
  )
}
