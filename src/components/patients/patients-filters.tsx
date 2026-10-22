'use client'

import { Search, X, LayoutGrid, List, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FilterToolbar } from '@/components/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PatientDirectoryFilters } from '@/types/patient-page'
import { CLIENT_TABLE_SEARCH_PLACEHOLDER } from '@/lib/patients/patient-directory-search'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/patient-stats'

interface PatientsFiltersProps {
  filters: PatientDirectoryFilters
  searchInput: string
  searchHighlight: boolean
  onSearchInputChange: (value: string) => void
  onSearchSubmit: () => void
  onSearchClear: () => void
  onFilterChange: <K extends keyof PatientDirectoryFilters>(
    key: K,
    value: PatientDirectoryFilters[K]
  ) => void
  onClear: () => void
  activeFilterCount: number
  availableYears: number[]
  totalFiltered: number
  total: number
  totalAmount: number
  loading?: boolean
  viewMode: 'table' | 'compact'
  onViewModeChange: (mode: 'table' | 'compact') => void
}

export function PatientsFilters({
  filters,
  searchInput,
  searchHighlight,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  onFilterChange,
  onClear,
  activeFilterCount,
  availableYears,
  totalFiltered,
  total,
  totalAmount,
  loading = false,
  viewMode,
  onViewModeChange,
}: PatientsFiltersProps) {

  return (
    <FilterToolbar
      count={
        loading ? (
          <span className="inline-block h-3 w-20 animate-pulse rounded-md bg-muted align-middle" aria-busy="true" />
        ) : totalFiltered === total ? (
          `${total} patients`
        ) : (
          `${totalFiltered} of ${total} patients`
        )
      }
    >
      <div
        className={cn(
          'flex h-8 w-full min-w-0 items-center overflow-hidden rounded-xl border border-border bg-background shadow-sm sm:w-auto sm:max-w-sm sm:flex-1',
          'focus-within:ring-2 focus-within:ring-ring'
        )}
      >
        <span className="pointer-events-none flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground" aria-hidden>
          <Search className="h-4 w-4" strokeWidth={2} />
        </span>
        <Input
          aria-label="Search patients"
          placeholder={CLIENT_TABLE_SEARCH_PLACEHOLDER}
          className="h-8 flex-1 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSearchSubmit()
            }
          }}
        />
        {searchInput.length > 0 && (
          <button
            type="button"
            onClick={onSearchClear}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
        {searchInput.length > 0 && (
          <button
            type="button"
            onClick={onSearchSubmit}
            className={cn(
              'mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors',
              searchHighlight ? 'text-[hsl(var(--metric-patients))]' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="Search patients"
          >
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>

      <Select value={filters.year} onValueChange={(v) => onFilterChange('year', v)}>
        <SelectTrigger
          aria-label="Year"
          className="h-8 w-[8.5rem] shrink-0 rounded-xl border-border bg-background px-3 text-xs font-medium shadow-sm"
        >
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All years</SelectItem>
          {availableYears.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span
        className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-xl border border-border bg-background px-3 text-xs font-medium text-muted-foreground shadow-sm"
        aria-label={loading ? 'Total amount loading' : `Total amount ${formatAmount(totalAmount)}`}
        aria-busy={loading || undefined}
      >
        Total amount:{' '}
        {loading ? (
          <span className="inline-block h-3 w-12 animate-pulse rounded-md bg-muted align-middle" />
        ) : (
          <span className="tabular-nums text-foreground">{formatAmount(totalAmount)}</span>
        )}
      </span>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border border-border bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-muted/50"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters ({activeFilterCount})
        </button>
      )}

      <div className="ml-auto flex shrink-0 rounded-xl border border-border bg-background p-0.5 shadow-sm">
        {([
          ['table', 'Table view', List],
          ['compact', 'Compact view', LayoutGrid],
        ] as const).map(([mode, label, Icon]) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            aria-label={label}
            aria-pressed={viewMode === mode}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
              viewMode === mode ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </FilterToolbar>
  )
}
