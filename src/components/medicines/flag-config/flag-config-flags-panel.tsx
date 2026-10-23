'use client'

import { SectionCard, SectionCardHeader } from '@/components/shared/section-card'
import { DataTable, THead, Th, Tr, Td } from '@/components/shared/data-table'
import { ArrowLeft, Pencil, Plus, Search, Tag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skel } from '@/components/medicines/skeleton-bits'
import { cn } from '@/lib/utils'
import type { FlagCategory, FlagItem } from '@/types/flag-config'

interface FlagConfigFlagsPanelProps {
  category: FlagCategory | null
  flags: FlagItem[]
  search: string
  onSearchChange: (value: string) => void
  onAddFlag: () => void
  onEditFlag: (flag: FlagItem) => void
  onDeleteFlag: (flag: FlagItem) => void
  onBack?: () => void
  showBack?: boolean
  loading?: boolean
  categoriesLoading?: boolean
  disabled?: boolean
  className?: string
}

export function FlagConfigFlagsPanel({
  category,
  flags,
  search,
  onSearchChange,
  onAddFlag,
  onEditFlag,
  onDeleteFlag,
  onBack,
  showBack,
  loading,
  categoriesLoading,
  disabled,
  className,
}: FlagConfigFlagsPanelProps) {
  if (!category && !categoriesLoading) {
    return (
      <SectionCard className={cn('flag-config-panel items-center justify-center p-8', className)}>
        <p className="text-sm text-muted-foreground">{'Select a category to view flags.'}</p>
      </SectionCard>
    )
  }

  const headerLoading = !category
  const bodyLoading = loading || headerLoading
  const total = category?.flagCount ?? 0

  return (
    <SectionCard className={cn('flag-config-panel', className)}>
      {headerLoading ? (
        <header className="flex items-start gap-4 border-b border-border px-5 py-4 sm:px-6" aria-busy="true">
          <div className="space-y-1.5">
            <Skel className="h-4 w-40" />
            <Skel className="h-3.5 w-24" />
          </div>
        </header>
      ) : (
        <SectionCardHeader
          title={category?.name ?? ''}
          description={`${total} items available`}
          icon={<Tag className="h-4 w-4" />}
          accent="medicines"
          actions={
            showBack && onBack ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="flag-config-back h-8 w-8 md:hidden"
                onClick={onBack}
                aria-label={'Back to categories'}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : undefined
          }
        />
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-5 py-3">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={'Search flags...'}
            aria-label={'Search flags'}
            className="h-8 rounded-xl pl-9 text-xs shadow-sm"
            disabled={disabled || headerLoading}
          />
        </div>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {headerLoading || loading ? <Skel className="h-3.5 w-16" /> : `${flags.length} flags`}
        </span>
        <Button
          size="sm"
          className="flag-config-primary h-8 shrink-0 rounded-xl text-xs"
          onClick={onAddFlag}
          disabled={disabled || headerLoading}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {'Add Flag'}
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {(
          <>
            <div className="space-y-2 p-3 md:hidden" aria-busy={bodyLoading || undefined}>
              {bodyLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-16 w-full rounded-xl" />)
              ) : flags.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[hsl(var(--glass-border))] px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    {search.trim() ? 'No flags match your search.' : 'No flags in this category yet.'}
                  </p>
                </div>
              ) : (
                flags.map((flag) => (
                  <article key={flag.id} className="flag-config-flag-card rounded-xl p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">{flag.label}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                          ID {flag.id}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="flag-config-action-edit h-8 w-8"
                          onClick={() => onEditFlag(flag)}
                          disabled={disabled}
                          aria-label={'Edit flag'}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="flag-config-action-delete h-8 w-8"
                          onClick={() => onDeleteFlag(flag)}
                          disabled={disabled}
                          aria-label={'Delete flag'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="hidden md:block">
              <DataTable>
                <THead>
                  <tr>
                    <Th className="w-[160px]">{'ID'}</Th>
                    <Th>{'Label'}</Th>
                    <Th className="w-[110px] text-right">
                      {'Actions'}
                    </Th>
                  </tr>
                </THead>
                <tbody aria-busy={bodyLoading || undefined}>
                  {bodyLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Tr key={i} className="flag-config-table-row">
                        <Td >
                          <Skel className="h-4 w-24" />
                        </Td>
                        <Td>
                          <Skel className="h-4 w-48" />
                        </Td>
                        <Td >
                          <div className="ml-auto flex w-[4.5rem] justify-end gap-1">
                            <Skel className="h-8 w-8" />
                            <Skel className="h-8 w-8" />
                          </div>
                        </Td>
                      </Tr>
                    ))
                  ) : flags.length === 0 ? (
                    <Tr>
                      <Td
                        colSpan={3}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        {search.trim() ? 'No flags match your search.' : 'No flags in this category yet.'}
                      </Td>
                    </Tr>
                  ) : (
                    flags.map((flag) => (
                      <Tr key={flag.id} className="flag-config-table-row">
                        <Td className="max-w-[160px] truncate font-mono text-xs text-muted-foreground">
                          {flag.id}
                        </Td>
                        <Td className="font-medium text-foreground">{flag.label}</Td>
                        <Td className="text-right">
                          <div className="inline-flex items-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="flag-config-action-edit h-8 w-8"
                              onClick={() => onEditFlag(flag)}
                              disabled={disabled}
                              aria-label={'Edit flag'}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="flag-config-action-delete h-8 w-8"
                              onClick={() => onDeleteFlag(flag)}
                              disabled={disabled}
                              aria-label={'Delete flag'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </DataTable>
            </div>
          </>
        )}
      </ScrollArea>
    </SectionCard>
  )
}
