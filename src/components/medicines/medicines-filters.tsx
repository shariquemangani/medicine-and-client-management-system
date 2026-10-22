'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Send, X, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterToolbar, FilterChip } from '@/components/shared/filter-toolbar'
import type { MedicineDirectoryFilters } from '@/types/medicine-page'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'
import type { Medicine } from '@/types'
import { Skel } from '@/components/medicines/skeleton-bits'

interface MedicinesFiltersProps {
  filters: MedicineDirectoryFilters
  onFilterChange: <K extends keyof MedicineDirectoryFilters>(
    key: K,
    value: MedicineDirectoryFilters[K]
  ) => void
  onClear: () => void
  activeFilterCount: number
  totalFiltered: number
  total: number
  loading?: boolean
  /** Loaded medicines; used to build the status / form type options. */
  medicines?: Medicine[]
  viewMode: 'table' | 'compact'
  onViewModeChange: (mode: 'table' | 'compact') => void
}

export function MedicinesFilters({
  filters,
  onFilterChange,
  onClear,
  activeFilterCount,
  totalFiltered,
  total,
  loading,
  medicines = [],
  viewMode,
  onViewModeChange,
}: MedicinesFiltersProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search)

  useEffect(() => {
    setSearchDraft(filters.search)
  }, [filters.search])

  // Options accumulate across loads so narrowing a filter never removes the other choices.
  const seen = useRef({ status: new Set<string>(), formType: new Set<string>() })
  const { statusOptions, formOptions } = useMemo(() => {
    for (const m of medicines) {
      if (m.status) seen.current.status.add(m.status)
      if (m.formType) seen.current.formType.add(m.formType)
    }
    if (filters.status !== 'all') seen.current.status.add(filters.status)
    if (filters.formType !== 'all') seen.current.formType.add(filters.formType)
    const toOptions = (set: Set<string>) =>
      Array.from(set).sort((a, b) => a.localeCompare(b)).map((value) => ({ value, label: value }))
    return { statusOptions: toOptions(seen.current.status), formOptions: toOptions(seen.current.formType) }
  }, [medicines, filters.status, filters.formType])

  const submitSearch = () => {
    onFilterChange('search', searchDraft.trim())
  }

  return (
    <FilterToolbar
      className="classes-filters"
      count={loading ? <Skel className="h-3.5 w-24" /> : `${totalFiltered} of ${total} medicines`}
    >
      <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          placeholder={t('medicines.searchPlaceholder')}
          aria-label={t('medicines.searchPlaceholder')}
          className="h-8 rounded-xl pl-9 pr-9 text-xs shadow-sm"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submitSearch()
            }
          }}
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={submitSearch}
          aria-label={t('medicines.searchAction')}
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
        <FilterChip
          label={'Status'}
          options={statusOptions}
          selected={filters.status === 'all' ? [] : [filters.status]}
          onChange={(next) => onFilterChange('status', next.length ? next[next.length - 1] : 'all')}
        />
        <FilterChip
          label={'Form type'}
          options={formOptions}
          selected={filters.formType === 'all' ? [] : [filters.formType]}
          onChange={(next) => onFilterChange('formType', next.length ? next[next.length - 1] : 'all')}
        />
      <div className="flex h-8 items-center rounded-xl border border-border bg-background p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={cn(
            'flex h-6 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors',
            viewMode === 'table' && 'bg-muted text-foreground'
          )}
          aria-label={t('medicines.tableView')}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('compact')}
          className={cn(
            'flex h-6 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors',
            viewMode === 'compact' && 'bg-muted text-foreground'
          )}
          aria-label={t('medicines.compactView')}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>
      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs" onClick={onClear}>
          <X className="mr-1 h-3.5 w-3.5" />
          {t('medicines.clearFilters')} ({activeFilterCount})
        </Button>
      )}
    </FilterToolbar>
  )
}
