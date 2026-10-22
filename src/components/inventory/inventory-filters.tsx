'use client'

import { useEffect, useState } from 'react'
import { Search, Send, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterToolbar, FilterChip } from '@/components/shared'
import type { StockDirectoryFilters } from '@/types/stock-page'
import type { StockLevelStatus } from '@/types/stock'
import { STOCK_STATUS_LABELS } from '@/lib/stock-utils'
import { t } from '@/lib/labels'

interface InventoryFiltersProps {
  filters: StockDirectoryFilters
  onFilterChange: <K extends keyof StockDirectoryFilters>(
    key: K,
    value: StockDirectoryFilters[K]
  ) => void
  onClear: () => void
  activeFilterCount: number
  totalFiltered: number
  total: number
  formTypes: string[]
  locations: string[]
  loading?: boolean
}

const statusOptions: (StockLevelStatus | 'all')[] = [
  'all',
  'healthy',
  'low',
  'critical',
  'out_of_stock',
  'overstocked',
]

export function InventoryFilters({
  filters,
  onFilterChange,
  onClear,
  activeFilterCount,
  totalFiltered,
  total,
  formTypes,
  locations,
  loading,
}: InventoryFiltersProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search)

  useEffect(() => {
    setSearchDraft(filters.search)
  }, [filters.search])

  const submitSearch = () => onFilterChange('search', searchDraft.trim())

  const single = (current: string) => (current === 'all' ? [] : [current])
  const pick = (current: string) => (next: string[]) => next.find((v) => v !== current) ?? 'all'

  const count = loading ? (
    <span aria-busy="true" className="animate-pulse inline-block h-3 w-24 rounded-md bg-muted align-middle" />
  ) : (
    t('inventory.resultsCount', { filtered: totalFiltered, total })
  )

  return (
    <FilterToolbar count={count}>
      <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          placeholder={t('inventory.searchPlaceholder')}
          className="h-8 rounded-xl pl-8 pr-9 text-xs shadow-sm"
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
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={submitSearch}
          aria-label={t('inventory.searchAction')}
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <FilterChip
        label={t('inventory.filterStatus')}
        options={statusOptions
          .filter((s) => s !== 'all')
          .map((s) => ({ value: s, label: STOCK_STATUS_LABELS[s as StockLevelStatus] }))}
        selected={single(filters.status)}
        onChange={(next) => onFilterChange('status', pick(filters.status)(next) as StockDirectoryFilters['status'])}
      />
      <FilterChip
        label={t('inventory.filterFormType')}
        options={formTypes.map((f) => ({ value: f, label: f }))}
        selected={single(filters.formType)}
        onChange={(next) => onFilterChange('formType', pick(filters.formType)(next))}
      />
      <FilterChip
        label={t('inventory.filterLocation')}
        options={locations.map((l) => ({ value: l, label: l }))}
        selected={single(filters.location)}
        onChange={(next) => onFilterChange('location', pick(filters.location)(next))}
      />
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" className="h-8 rounded-xl px-2 text-xs" onClick={onClear}>
          <X className="mr-1 h-3.5 w-3.5" />
          {t('common.clearFilters')}
        </Button>
      )}
    </FilterToolbar>
  )
}
