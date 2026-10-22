'use client'

import { Search, X, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterToolbar, FilterChip } from '@/components/shared'
import type { PrescriptionDirectoryFilters } from '@/types/prescription-page'
import { cn } from '@/lib/utils'

interface PrescriptionsFiltersProps {
  filters: PrescriptionDirectoryFilters
  onFilterChange: <K extends keyof PrescriptionDirectoryFilters>(
    key: K,
    value: PrescriptionDirectoryFilters[K]
  ) => void
  onClear: () => void
  activeFilterCount: number
  availableTerms: string[]
  totalFiltered: number
  total: number
  viewMode: 'table' | 'compact'
  onViewModeChange: (mode: 'table' | 'compact') => void
  loading?: boolean
}

export function PrescriptionsFilters({
  filters,
  onFilterChange,
  onClear,
  activeFilterCount,
  availableTerms,
  totalFiltered,
  total,
  viewMode,
  onViewModeChange,
  loading,
}: PrescriptionsFiltersProps) {

  const count = loading ? (
    <span className="animate-pulse inline-block h-3 w-28 rounded-md bg-muted align-middle" aria-busy="true" />
  ) : (
    `${totalFiltered} of ${total} exams`
  )

  return (
    <FilterToolbar count={count}>
      <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          placeholder={'Search exam name, term, subjects...'}
          className="h-8 rounded-xl pl-8 text-xs shadow-sm"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>
      <FilterChip
        label="Term"
        options={availableTerms.map((term) => ({ value: term, label: term }))}
        selected={filters.term === 'all' ? [] : [filters.term]}
        onChange={(next) => onFilterChange('term', next.find((v) => v !== filters.term) ?? 'all')}
      />
      <div className="flex h-8 items-center rounded-xl border border-border bg-background p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground',
            viewMode === 'table' && 'bg-muted text-foreground'
          )}
          aria-label={'Table view'}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('compact')}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground',
            viewMode === 'compact' && 'bg-muted text-foreground'
          )}
          aria-label={'Compact view'}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" className="h-8 rounded-xl px-2 text-xs" onClick={onClear}>
          <X className="mr-1 h-3.5 w-3.5" />
          {'Clear filters'} ({activeFilterCount})
        </Button>
      )}
    </FilterToolbar>
  )
}
