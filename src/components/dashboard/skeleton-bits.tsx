import { cn } from '@/lib/utils'

/** Placeholder block for data that is still loading. */
export function Sk({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden />
}
