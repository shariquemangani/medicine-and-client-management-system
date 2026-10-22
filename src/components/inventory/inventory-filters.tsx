'use client'

import { useEffect, useState } from 'react'
import { Search, Send, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  return (
    <div className="attendance-record-toolbar space-y-3 rounded-2xl border p-4 sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="classes-search relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              placeholder={t('inventory.searchPlaceholder')}
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
              aria-label={t('inventory.searchAction')}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" className="classes-filter-clear" onClick={onClear}>
              <X className="mr-1 h-3.5 w-3.5" />
              {t('common.clearFilters')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t('inventory.filterStatus')}
          </label>
          <Select
            value={filters.status}
            onValueChange={(v) => onFilterChange('status', v as StockDirectoryFilters['status'])}
          >
            <SelectTrigger className="attendance-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'all' ? t('common.all') : STOCK_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('inventory.filterFormType')}
          </label>
          <Select value={filters.formType} onValueChange={(v) => onFilterChange('formType', v)}>
            <SelectTrigger className="attendance-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {formTypes.map((form) => (
                <SelectItem key={form} value={form}>
                  {form}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t('inventory.filterLocation')}
          </label>
          <Select value={filters.location} onValueChange={(v) => onFilterChange('location', v)}>
            <SelectTrigger className="attendance-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-4 items-center" aria-busy="true">
          <div className="animate-pulse h-3 w-32 rounded-md bg-muted" />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t('inventory.resultsCount', { filtered: totalFiltered, total })}
        </p>
      )}
    </div>
  )
}
