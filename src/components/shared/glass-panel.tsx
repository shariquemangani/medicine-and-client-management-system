'use client'

import { cn } from '@/lib/utils'
import { glassPanelClass } from '@/utils/theme'

interface GlassPanelProps {
  children: React.ReactNode
  className?: string
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div className={cn(glassPanelClass, 'rounded-2xl p-5', className)}>
      {children}
    </div>
  )
}
