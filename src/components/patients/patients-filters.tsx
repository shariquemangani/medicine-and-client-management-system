'use client'

import {
  Search,
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  ArrowDown,
  ArrowRight,
  LucideArrowBigRightDash,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { patientQuickFilters } from '@/data/patients-page'
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
    <div className="clinic-filters space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div
            className={cn(
              'clinic-search flex min-w-0 flex-1 items-center overflow-hidden rounded-md border',
              'border-[hsl(var(--glass-border))] bg-[hsl(var(--glass)/0.45)] backdrop-blur-sm',
              'focus-within:border-[hsl(var(--metric-patients)/0.5)]',
              'focus-within:ring-2 focus-within:ring-[hsl(var(--metric-patients)/0.15)]'
            )}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground pointer-events-none"
              aria-hidden
            >
              <Search className="h-4 w-4" strokeWidth={2} />
            </span>
            <Input
              placeholder={CLIENT_TABLE_SEARCH_PLACEHOLDER}
              className="clinic-search-input h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
                className="clinic-search-clear flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
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
                  'clinic-search-btn flex h-8 w-8 rounded-md mr-1 shrink-0 items-center justify-center transition-colors hover:border-2 hover:border-metric-patients',
                  searchHighlight
                    ? 'text-[hsl(var(--metric-patients))]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="Search patients"
              >
                <ArrowRight className="h-6 w-6" strokeWidth={2} />
              </button>
            )}

          </div>
          <Select value={filters.year} onValueChange={(v) => onFilterChange('year', v)}>
            <SelectTrigger className="clinic-filter-select w-full sm:w-[10rem]">
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
        </div>
        <div className="flex items-center gap-2">
          <div className="clinic-view-toggle flex rounded-lg border p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={cn(
                'clinic-view-toggle-btn rounded-md p-1.5 transition-colors',
                viewMode === 'table' && 'clinic-view-toggle-btn-active'
              )}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('compact')}
              className={cn(
                'clinic-view-toggle-btn rounded-md p-1.5 transition-colors',
                viewMode === 'compact' && 'clinic-view-toggle-btn-active'
              )}
              aria-label="Compact view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" className="clinic-filter-clear" onClick={onClear}>
              <X className="mr-1 h-3.5 w-3.5" />
              Clear filters ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {patientQuickFilters.map((chip) => {
            const label = chip.label
            const isActive = chip.labelKey === 'patients.totalPatients' && filters.year === 'all'
            return (
              <button
                key={chip.labelKey}
                type="button"
                onClick={() => {
                  onFilterChange('year', 'all')
                }}
                className={cn(
                  'clinic-filter-chip rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
                  `clinic-filter-chip-${chip.accent}`,
                  isActive && 'clinic-filter-chip-active'
                )}
              >
                {label}
              </button>
            )
          })}
          <span
            className="clinic-filter-chip clinic-filter-chip-billing rounded-full px-3 py-1 text-xs font-medium"
            aria-label={loading ? 'Total amount loading' : `Total amount ${formatAmount(totalAmount)}`}
            aria-busy={loading || undefined}
          >
            Total Amount:{' '}
            {loading ? <span className="inline-block h-3 w-12 animate-pulse rounded-md bg-muted align-middle" /> : formatAmount(totalAmount)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {loading ? (
              <span className="inline-block h-3 w-32 animate-pulse rounded-md bg-muted" aria-busy="true" />
            ) : (
              <span>Showing {totalFiltered} of {total} patients</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
