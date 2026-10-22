'use client'

import { format } from 'date-fns'
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  RefreshCcw,
  Settings2,
  Trash2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StockMovement } from '@/types/stock'
import type { MovementRange, MovementTypeFilter } from '@/hooks/use-stock-directory'
import { STOCK_MOVEMENT_LABELS } from '@/lib/stock-utils'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

interface InventoryMovementsPanelProps {
  /** Movements after type/date filters. */
  movements: StockMovement[]
  /** How many movements are loaded in total (before filters). */
  loadedCount: number
  /** The service-side cap on loaded movements. */
  loadLimit: number
  loading?: boolean
  movementType: MovementTypeFilter
  onMovementTypeChange: (value: MovementTypeFilter) => void
  movementRange: MovementRange
  onMovementRangeChange: (value: MovementRange) => void
}

const typeIcons = {
  purchase: ArrowDownLeft,
  dispense: ArrowUpRight,
  adjustment: Settings2,
  return: RefreshCcw,
  expired: Trash2,
  transfer: RefreshCcw,
} as const

const typeColors = {
  purchase: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  dispense: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25',
  adjustment: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
  return: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/25',
  expired: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/25',
  transfer: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
} as const

const typeOptions: MovementTypeFilter[] = [
  'all',
  'purchase',
  'dispense',
  'adjustment',
  'return',
  'expired',
]

const rangeOptions: { value: MovementRange; labelKey: string }[] = [
  { value: 'all', labelKey: 'inventory.rangeAll' },
  { value: '7', labelKey: 'inventory.range7' },
  { value: '30', labelKey: 'inventory.range30' },
  { value: '90', labelKey: 'inventory.range90' },
]

function formatMovementDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMM d, yyyy · h:mm a')
}

export function InventoryMovementsPanel({
  movements,
  loadedCount,
  loadLimit,
  loading,
  movementType,
  onMovementTypeChange,
  movementRange,
  onMovementRangeChange,
}: InventoryMovementsPanelProps) {
  const filtersActive = movementType !== 'all' || movementRange !== 'all'

  const filters = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="movement-type-filter" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {t('inventory.filterMovementType')}
        </label>
        <Select value={movementType} onValueChange={(v) => onMovementTypeChange(v as MovementTypeFilter)}>
          <SelectTrigger id="movement-type-filter" className="attendance-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? t('inventory.typeAll') : STOCK_MOVEMENT_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="movement-range-filter" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          {t('inventory.filterDateRange')}
        </label>
        <Select value={movementRange} onValueChange={(v) => onMovementRangeChange(v as MovementRange)}>
          <SelectTrigger id="movement-range-filter" className="attendance-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rangeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {filters}
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-20 w-full rounded-md bg-muted" />
          ))}
        </div>
        <div className="flex h-4 items-center justify-center">
          <div className="animate-pulse h-3 w-40 rounded-md bg-muted" />
        </div>
      </div>
    )
  }

  if (loadedCount === 0) {
    return (
      <div className="attendance-history-empty rounded-2xl border p-10 text-center">
        <div className="attendance-history-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <History className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground">{t('inventory.noMovements')}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          {t('inventory.noMovementsHint')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filters}

      {movements.length === 0 ? (
        <div className="attendance-history-empty rounded-2xl border p-10 text-center">
          <div className="attendance-history-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <History className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">{t('inventory.noMovementsFiltered')}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {t('inventory.noMovementsFilteredHint')}
          </p>
        </div>
      ) : (
        <div className="attendance-history-list space-y-3">
          {movements.map((movement, index) => {
            const Icon = typeIcons[movement.type]
            const isInbound = movement.quantity > 0

            return (
              <article
                key={movement.id}
                className="attendance-history-row clinic-list-item-enter rounded-2xl border p-4"
                style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                        typeColors[movement.type]
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-foreground">{movement.medicineName}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {STOCK_MOVEMENT_LABELS[movement.type]}
                        {movement.batchNumber ? ` · ${t('inventory.movementBatch')} ${movement.batchNumber}` : ''}
                      </p>
                      {movement.notes ? (
                        <p className="mt-1 break-words text-xs text-muted-foreground">{movement.notes}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 sm:text-right">
                    <div>
                      <p
                        className={cn(
                          'text-lg font-bold tabular-nums',
                          isInbound ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                        )}
                      >
                        {isInbound ? '+' : ''}
                        {movement.quantity} {movement.unit}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t('inventory.balanceAfter')}: {movement.balanceAfter}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span>{formatMovementDate(movement.createdAt)}</span>
                  {movement.reference ? (
                    <span>
                      {t('inventory.movementRef')}: {movement.reference}
                    </span>
                  ) : null}
                  {movement.performedBy ? (
                    <span>
                      {t('inventory.movementBy')} {movement.performedBy}
                    </span>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground" data-testid="movements-footer">
        {filtersActive
          ? t('inventory.movementsFooterFiltered', { shown: movements.length, limit: loadLimit })
          : loadedCount >= loadLimit
            ? t('inventory.movementsFooter', { limit: loadLimit })
            : t('inventory.movementsFooterAll', { count: loadedCount })}
      </p>
    </div>
  )
}
