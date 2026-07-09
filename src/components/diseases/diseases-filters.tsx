'use client'

import { useEffect, useState } from 'react'
import { Search, Send, SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { DiseaseDirectoryFilters } from '@/types/disease-page'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

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
    <div className="classes-filters space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="classes-search relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              placeholder={t('diseases.searchPlaceholder')}
              className="classes-search-input h-11 rounded-xl pl-10 pr-12"
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
              className="classes-search-send"
              onClick={submitSearch}
              aria-label={t('diseases.searchAction')}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="classes-view-toggle flex rounded-lg border p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={cn(
                'classes-view-toggle-btn rounded-md p-1.5 transition-colors',
                viewMode === 'table' && 'classes-view-toggle-btn-active'
              )}
              aria-label={t('diseases.tableView')}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('compact')}
              className={cn(
                'classes-view-toggle-btn rounded-md p-1.5 transition-colors',
                viewMode === 'compact' && 'classes-view-toggle-btn-active'
              )}
              aria-label={t('diseases.compactView')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" className="classes-filter-clear" onClick={onClear}>
              <X className="mr-1 h-3.5 w-3.5" />
              {t('diseases.clearFilters')} ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>{t('diseases.showing', { filtered: totalFiltered, total })}</span>
      </div>
    </div>
  )
}
