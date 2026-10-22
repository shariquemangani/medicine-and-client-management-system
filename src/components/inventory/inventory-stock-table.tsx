'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Minus,
  PackagePlus,
  Pencil,
  Pill,
  Plus,
  Trash2,
} from 'lucide-react'
import type { StockItem } from '@/types/stock'
import type { StockSortDirection, StockSortField } from '@/types/stock-page'
import { Button } from '@/components/ui/button'
import { SectionCard, DataTable, THead, Th, Tr, Td } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  getExpiredQuantity,
  getSellableQuantity,
  getStockFillPercent,
  getStockLevelStatus,
  STOCK_STATUS_LABELS,
} from '@/lib/stock-utils'
import { t } from '@/lib/labels'
import { usePermission } from '@/hooks/use-permission'

interface InventoryStockTableProps {
  items: StockItem[]
  loading?: boolean
  sortField: StockSortField
  sortDirection: StockSortDirection
  onSort: (field: StockSortField) => void
  onView: (item: StockItem) => void
  onReceive: (item: StockItem) => void
  onAdjust: (item: StockItem) => void
  onEdit: (item: StockItem) => void
  onDelete: (item: StockItem) => void
  onAddItem: () => void
  /** Number of stock items before any filter is applied; 0 shows the first-run empty state. */
  totalItems: number
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
          {getSellableQuantity(item)} {item.unit}
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
      {getExpiredQuantity(item) > 0 ? (
        <p className="text-[10px] font-medium text-red-600 dark:text-red-400">
          +{getExpiredQuantity(item)} {item.unit} {t('inventory.expired').toLowerCase()}
        </p>
      ) : null}
    </div>
  )
}

interface ItemActionsProps {
  item: StockItem
  onView: (item: StockItem) => void
  onReceive: (item: StockItem) => void
  onAdjust: (item: StockItem) => void
  onEdit: (item: StockItem) => void
  onDelete: (item: StockItem) => void
}

function ItemActions({ item, onView, onReceive, onAdjust, onEdit, onDelete }: ItemActionsProps) {
  const { hasPermission } = usePermission()
  const canDelete = hasPermission('inventory', 'delete')
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="clinic-table-action h-9 w-9"
        aria-label={`${t('inventory.viewItem')}: ${item.medicineName}`}
        onClick={() => onView(item)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="clinic-table-action h-9 w-9"
        aria-label={`${t('inventory.receiveStock')}: ${item.medicineName}`}
        onClick={() => onReceive(item)}
      >
        <PackagePlus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="clinic-table-action h-9 w-9"
        aria-label={`${t('inventory.adjustStock')}: ${item.medicineName}`}
        onClick={() => onAdjust(item)}
        disabled={item.totalQuantity <= 0}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="clinic-table-action h-9 w-9"
            aria-label={`${t('inventory.moreActions')}: ${item.medicineName}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(item)}>
            <Pencil className="mr-2 h-4 w-4" />
            {t('inventory.editItem')}
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 dark:text-red-400"
              onSelect={() => onDelete(item)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('inventory.deleteItem')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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
  onEdit,
  onDelete,
  onAddItem,
  totalItems,
  page,
  totalPages,
  totalFiltered,
  pageSize,
  onPageChange,
}: InventoryStockTableProps) {
  if (loading) {
    // Column headers are static; only the rows are pending.
    const headers = [
      t('inventory.colMedicine'),
      t('inventory.colOnHand'),
      t('inventory.colLocation'),
      t('inventory.colStatus'),
      t('inventory.colActions'),
    ]
    return (
      <SectionCard aria-busy="true">
        <div className="space-y-3 p-4 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse h-36 w-full rounded-md bg-muted" />
          ))}
        </div>
        <div className="hidden md:block">
          <DataTable className="min-w-[48rem]">
            <THead>
              <tr>
                {headers.map((label, i) => (
                  <Th key={label} className={cn(i === 1 && 'min-w-[10rem]', i === 4 && 'text-right')}>
                    {label}
                  </Th>
                ))}
              </tr>
            </THead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <Tr key={i}>
                  <Td><div className="animate-pulse h-9 w-40 rounded-md bg-muted" /></Td>
                  <Td><div className="animate-pulse h-9 w-32 rounded-md bg-muted" /></Td>
                  <Td><div className="animate-pulse h-4 w-20 rounded-md bg-muted" /></Td>
                  <Td><div className="animate-pulse h-5 w-16 rounded-md bg-muted" /></Td>
                  <Td><div className="animate-pulse ml-auto h-9 w-28 rounded-md bg-muted" /></Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        </div>
      </SectionCard>
    )
  }

  if (totalItems === 0) {
    return (
      <SectionCard className="p-10 text-center">
        <Pill className="mx-auto h-10 w-10 text-muted-foreground/60" />
        <p className="mt-3 text-sm font-medium text-foreground">{t('inventory.noItemsTitle')}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{t('inventory.noItemsHint')}</p>
        <Button size="sm" className="attendance-hero-primary mt-4" onClick={onAddItem}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t('inventory.addItem')}
        </Button>
      </SectionCard>
    )
  }

  if (items.length === 0) {
    return (
      <SectionCard className="p-10 text-center">
        <Pill className="mx-auto h-10 w-10 text-muted-foreground/60" />
        <p className="mt-3 text-sm font-medium text-foreground">{t('inventory.emptyTitle')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('inventory.emptyHint')}</p>
      </SectionCard>
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
    <SectionCard>
      <div className="space-y-3 p-4 md:hidden" data-testid="stock-cards">
        {items.map((item) => {
          const status = getStockLevelStatus(item)
          return (
            <article
              key={item.id}
              className={cn(
                'rounded-2xl border p-4',
                status === 'out_of_stock' && 'bg-red-500/[0.03]',
                status === 'critical' && 'bg-orange-500/[0.03]'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <button type="button" className="min-w-0 text-left" onClick={() => onView(item)}>
                  <p className="truncate font-semibold text-foreground">{item.medicineName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[item.formType, item.potency, item.commonName].filter(Boolean).join(' · ') || '—'}
                  </p>
                </button>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 text-[10px] font-semibold', statusBadgeClass[status])}
                >
                  {STOCK_STATUS_LABELS[status]}
                </Badge>
              </div>
              <div className="mt-3">
                <StockLevelBar item={item} />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{item.location}</p>
              <div className="mt-2 border-t pt-2">
                <ItemActions
                  item={item}
                  onView={onView}
                  onReceive={onReceive}
                  onAdjust={onAdjust}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            </article>
          )
        })}
      </div>

      <div className="hidden md:block">
        <DataTable className="min-w-[48rem]">
          <THead>
            <tr>
              <Th>{sortableHeader('medicineName', t('inventory.colMedicine'))}</Th>
              <Th className="min-w-[10rem]">{sortableHeader('totalQuantity', t('inventory.colOnHand'))}</Th>
              <Th>{sortableHeader('location', t('inventory.colLocation'))}</Th>
              <Th>{t('inventory.colStatus')}</Th>
              <Th className="text-right">{t('inventory.colActions')}</Th>
            </tr>
          </THead>
          <tbody>
            {items.map((item) => {
              const status = getStockLevelStatus(item)
              return (
                <Tr
                  key={item.id}
                  className={cn(
                    status === 'out_of_stock' && 'bg-red-500/[0.03]',
                    status === 'critical' && 'bg-orange-500/[0.03]'
                  )}
                >
                  <Td>
                    <button type="button" className="text-left" onClick={() => onView(item)}>
                      <p className="font-medium text-foreground">{item.medicineName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.potency, item.formType, item.commonName].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </button>
                  </Td>
                  <Td>
                    <StockLevelBar item={item} />
                  </Td>
                  <Td className="text-xs text-muted-foreground">{item.location}</Td>
                  <Td>
                    <Badge variant="outline" className={cn('text-[10px] font-semibold', statusBadgeClass[status])}>
                      {STOCK_STATUS_LABELS[status]}
                    </Badge>
                  </Td>
                  <Td>
                    <ItemActions
                      item={item}
                      onView={onView}
                      onReceive={onReceive}
                      onAdjust={onAdjust}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </DataTable>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {t('inventory.pagination', { start, end, total: totalFiltered })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="attendance-hero-btn"
            disabled={page <= 1}
            aria-label={t('inventory.previousPage')}
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
            aria-label={t('inventory.nextPage')}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </SectionCard>
  )
}
