'use client'

import { Settings2, Tags } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlagCategory } from '@/types/flag-config'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skel } from '@/components/medicines/skeleton-bits'

interface FlagConfigCategoriesProps {
  categories: FlagCategory[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function FlagConfigCategories({
  categories,
  selectedId,
  onSelect,
  loading,
  disabled,
  className,
}: FlagConfigCategoriesProps) {
  return (
    <aside className={cn('flag-config-sidebar flex h-full flex-col', className)}>
      <div className="border-b border-[hsl(var(--glass-border))] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flag-config-sidebar-icon flex h-8 w-8 items-center justify-center rounded-lg">
            <Settings2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{'Categories'}</p>
            <p className="text-[11px] text-muted-foreground">{'Select a category to manage.'}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-2 p-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skel key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">{'No categories yet. Add one to get started.'}</p>
          </div>
        ) : (
          <ul className="space-y-1 p-2.5" role="listbox" aria-label={'Categories'}>
            {categories.map((category) => {
              const active = category.id === selectedId
              const count = category.flagCount
              return (
                <li key={category.id}>
                  <div
                    className={cn(
                      'flag-config-category group relative flex w-full items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200',
                      active && 'flag-config-category-active'
                    )}
                  >
                    {active ? <span className="flag-config-category-bar" aria-hidden /> : null}
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => onSelect(category.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left"
                      disabled={disabled}
                    >
                      <span
                        className={cn(
                          'flag-config-category-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          active && 'flag-config-category-icon-active'
                        )}
                      >
                        <Tags className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {category.name}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {`${count} items`}
                        </span>
                      </span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
    </aside>
  )
}
