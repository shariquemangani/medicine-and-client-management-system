'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Minus,
  PackagePlus,
  Pill,
} from 'lucide-react'
import type { StockItem } from '@/types/stock'
import type { StockSortDirection, StockSortField } from '@/types/stock-page'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  getAvailableQuantity,
  getStockFillPercent,
  getStockLevelStatus,
  STOCK_STATUS_LABELS,
} from '@/lib/stock-utils'
import { t } from '@/lib/labels'

interface InventoryStockTableProps {
  items: StockItem[]
  loading?: boolean
  sortField: StockSortField
  sortDirection: StockSortDirection
  onSort: (field: StockSortField) => void
  onView: (item: StockItem) => void
  onReceive: (item: StockItem) => void
  onAdjust: (item: StockItem) => void
  page: number
  totalPages: number
  totalFiltered: number
  pageSize: number
  onPageChange: (page: number) => void
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: StockSortField
  sortField: StockSortField
  sortDirection: StockSortDirection
}) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-[hsl(var(--metric-attendance))]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[hsl(var(--metric-attendance))]" />
  )
}

const statusBadgeClass: Record<string, string> = {
  healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  low: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  critical: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400',
  out_of_stock: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  overstocked: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
}

function StockLevelBar({ item }: { item: StockItem }) {
  const percent = getStockFillPercent(item)
  const status = getStockLevelStatus(item)
  const barClass =
    status === 'healthy' || status === 'overstocked'
      ? 'bg-emerald-500'
      : status === 'low'
        ? 'bg-amber-500'
        : status === 'critical'
          ? 'bg-orange-500'
          : 'bg-red-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] tabular-nums">
        <span className="font-semibold text-foreground">
          {getAvailableQuantity(item)} {item.unit}
        </span>
        <span className="text-muted-foreground">
          {t('inventory.reorderAt')} {item.reorderLevel}
        </span>
      </div>
      <div className="attendance-record-progress-track h-1.5 overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function InventoryStockTable({
  items,
  loading,
  sortField,
  sortDirection,
  onSort,
  onView,
  onReceive,
  onAdjust,
  page,
  totalPages,
  totalFiltered,
  pageSize,
  onPageChange,
}: InventoryStockTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-skeleton h-16 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="attendance-record-empty rounded-2xl border p-10 text-center">
        <Pill className="mx-auto h-10 w-10 text-muted-foreground/60" />
        <p className="mt-3 text-sm font-medium text-foreground">{t('inventory.emptyTitle')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('inventory.emptyHint')}</p>
      </div>
    )
  }

  const sortableHeader = (field: StockSortField, label: string) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-foreground"
      onClick={() => onSort(field)}
    >
      {label}
      <SortIcon field={field} sortField={sortField} sortDirection={sortDirection} />
    </button>
  )

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalFiltered)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border">
        <table className="clinic-data-table w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3">{sortableHeader('medicineName', t('inventory.colMedicine'))}</th>
              <th className="px-4 py-3">{t('inventory.colPotency')}</th>
              <th className="px-4 py-3 min-w-[10rem]">
                {sortableHeader('totalQuantity', t('inventory.colOnHand'))}
              </th>
              <th className="px-4 py-3">{sortableHeader('location', t('inventory.colLocation'))}</th>
              <th className="px-4 py-3">{t('inventory.colStatus')}</th>
              <th className="px-4 py-3 text-right">{t('inventory.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const status = getStockLevelStatus(item)
              return (
                <tr
                  key={item.id}
                  className={cn(
                    'clinic-list-item-enter border-b transition-colors last:border-0 hover:bg-muted/20',
                    status === 'out_of_stock' && 'bg-red-500/[0.03]',
                    status === 'critical' && 'bg-orange-500/[0.03]'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => onView(item)}
                    >
                      <p className="font-semibold text-foreground">{item.medicineName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {[item.formType, item.commonName].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                    {item.potency ?? '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <StockLevelBar item={item} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{item.location}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant="outline" className={cn('text-[10px] font-semibold', statusBadgeClass[status])}>
                      {STOCK_STATUS_LABELS[status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="clinic-table-action h-8 w-8"
                        aria-label={t('inventory.viewItem')}
                        onClick={() => onView(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="clinic-table-action h-8 w-8"
                        aria-label={t('inventory.receiveStock')}
                        onClick={() => onReceive(item)}
                      >
                        <PackagePlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="clinic-table-action h-8 w-8"
                        aria-label={t('inventory.adjustStock')}
                        onClick={() => onAdjust(item)}
                        disabled={item.totalQuantity <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {t('inventory.pagination', { start, end, total: totalFiltered })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="attendance-hero-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="attendance-hero-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
