'use client'

import { cn } from '@/lib/utils'

interface BentoGridProps {
  children: React.ReactNode
  className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'dashboard-bento grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 auto-rows-min',
        className
      )}
    >
      {children}
    </div>
  )
}
