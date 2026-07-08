'use client'

import { ArrowLeft, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
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
  disabled,
  className,
}: FlagConfigFlagsPanelProps) {
  if (!category) {
    return (
      <div className={cn('flag-config-panel flex flex-col items-center justify-center p-8', className)}>
        <p className="text-sm text-muted-foreground">{'Select a category to view flags.'}</p>
      </div>
    )
  }

  const total = category.flagCount

  return (
    <div className={cn('flag-config-panel flex h-full flex-col', className)}>
      <div className="space-y-3 border-b border-[hsl(var(--glass-border))] px-4 py-3.5 sm:px-5">
        <div className="flex items-start gap-2">
          {showBack && onBack ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="flag-config-back mt-0.5 shrink-0 md:hidden"
              onClick={onBack}
              aria-label={'Back to categories'}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {category.name}
            </h2>
            <p className="text-[12px] text-muted-foreground">
              {`${total} items available`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={'Search flags...'}
              className="flag-config-search h-10 pl-9"
              disabled={disabled}
            />
          </div>
          <Button
            size="sm"
            className="flag-config-primary shrink-0"
            onClick={onAddFlag}
            disabled={disabled}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {'Add Flag'}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-2 p-3 md:p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-2 p-3 md:hidden">
              {flags.length === 0 ? (
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
              <Table>
                <TableHeader>
                  <TableRow className="flag-config-table-head hover:bg-transparent">
                    <TableHead className="w-[160px] pl-5">{'ID'}</TableHead>
                    <TableHead>{'Label'}</TableHead>
                    <TableHead className="w-[110px] pr-5 text-right">
                      {'Actions'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        {search.trim() ? 'No flags match your search.' : 'No flags in this category yet.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    flags.map((flag) => (
                      <TableRow key={flag.id} className="flag-config-table-row">
                        <TableCell className="max-w-[160px] truncate pl-5 font-mono text-xs text-muted-foreground">
                          {flag.id}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{flag.label}</TableCell>
                        <TableCell className="pr-5 text-right">
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  )
}
