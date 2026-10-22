'use client'

import { useEffect, useState } from 'react'
import { Search, Send, X, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterToolbar } from '@/components/shared/filter-toolbar'
import type { DiseaseDirectoryFilters } from '@/types/disease-page'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'
import { Skel } from '@/components/medicines/skeleton-bits'

interface DiseasesFiltersProps {
  filters: DiseaseDirectoryFilters
  onFilterChange: <K extends keyof DiseaseDirectoryFilters>(
    key: K,
    value: DiseaseDirectoryFilters[K]
  ) => void
  onClear: () => void
  activeFilterCount: number
  totalFiltered: number
  total: number
  loading?: boolean
  viewMode: 'table' | 'compact'
  onViewModeChange: (mode: 'table' | 'compact') => void
}

export function DiseasesFilters({
  filters,
  onFilterChange,
  onClear,
  activeFilterCount,
  totalFiltered,
  total,
  loading,
  viewMode,
  onViewModeChange,
}: DiseasesFiltersProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search)

  useEffect(() => {
    setSearchDraft(filters.search)
  }, [filters.search])

  const submitSearch = () => {
    onFilterChange('search', searchDraft.trim())
  }

  return (
    <FilterToolbar
      className="classes-filters"
      count={loading ? <Skel className="h-3.5 w-24" /> : `${totalFiltered} of ${total} diseases`}
    >
      <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          placeholder={t('diseases.searchPlaceholder')}
          aria-label={t('diseases.searchPlaceholder')}
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
          aria-label={t('diseases.searchAction')}
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <div className="flex h-8 items-center rounded-xl border border-border bg-background p-0.5 shadow-sm">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={cn(
            'flex h-6 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors',
            viewMode === 'table' && 'bg-muted text-foreground'
          )}
          aria-label={t('diseases.tableView')}
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
          aria-label={t('diseases.compactView')}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>
      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs" onClick={onClear}>
          <X className="mr-1 h-3.5 w-3.5" />
          {t('diseases.clearFilters')} ({activeFilterCount})
        </Button>
      )}
    </FilterToolbar>
  )
}
