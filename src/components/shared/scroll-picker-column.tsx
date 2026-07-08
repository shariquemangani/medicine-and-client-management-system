'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface ScrollPickerItem {
  value: string
  label: string
}

interface ScrollPickerColumnProps {
  label: string
  items: ScrollPickerItem[]
  value: string
  onSelect: (value: string) => void
  className?: string
}

export function ScrollPickerColumn({
  label,
  items,
  value,
  onSelect,
  className,
}: ScrollPickerColumnProps) {
  const selectedRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [value, items.length])

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col', className)}>
      <div className="mb-2 flex h-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>

      <ScrollArea className="h-[220px] rounded-2xl border border-border bg-muted/30">
        <div className="space-y-1 p-1.5">
          {items.map((item) => {
            const selected = item.value === value
            return (
              <Button
                key={item.value}
                ref={selected ? selectedRef : undefined}
                type="button"
                variant="ghost"
                className={cn(
                  'h-10 w-full rounded-xl text-xs font-semibold transition-all',
                  selected
                    ? 'bg-foreground text-background shadow-md hover:bg-foreground/90 hover:text-background'
                    : 'text-foreground hover:bg-background hover:shadow-sm'
                )}
                onClick={() => onSelect(item.value)}
              >
                {item.label}
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
