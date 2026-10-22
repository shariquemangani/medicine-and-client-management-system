'use client'

import { cn } from '@/lib/utils'

/** Placeholder block for data that is still loading. Size it like the final content. */
export function Skel({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-pulse rounded-md bg-muted', className)} />
}

/** A row of chip-shaped placeholders (potencies, symptoms, option groups). */
export function SkelChips({ count = 6, className }: { count?: number; className?: string }) {
  const widths = ['w-14', 'w-20', 'w-16', 'w-24', 'w-12', 'w-20']
  return (
    <div className={cn('flex flex-wrap gap-2', className)} aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skel key={i} className={cn('h-8 rounded-full', widths[i % widths.length])} />
      ))}
    </div>
  )
}
