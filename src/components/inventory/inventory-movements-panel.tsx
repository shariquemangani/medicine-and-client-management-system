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
import { FilterToolbar, FilterChip, SectionCard } from '@/components/shared'
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

  const countText = filtersActive
    ? t('inventory.movementsFooterFiltered', { shown: movements.length, limit: loadLimit })
    : loadedCount >= loadLimit
      ? t('inventory.movementsFooter', { limit: loadLimit })
      : t('inventory.movementsFooterAll', { count: loadedCount })

  const filters = (
    <FilterToolbar
      count={
        loading ? (
          <span aria-busy="true" className="animate-pulse inline-block h-3 w-32 rounded-md bg-muted align-middle" />
        ) : (
          <span data-testid="movements-footer">{countText}</span>
        )
      }
    >
      <FilterChip
        label={t('inventory.filterMovementType')}
        options={typeOptions
          .filter((x) => x !== 'all')
          .map((x) => ({ value: x, label: STOCK_MOVEMENT_LABELS[x as keyof typeof STOCK_MOVEMENT_LABELS] }))}
        selected={movementType === 'all' ? [] : [movementType]}
        onChange={(next) =>
          onMovementTypeChange((next.find((v) => v !== movementType) ?? 'all') as MovementTypeFilter)
        }
      />
      <FilterChip
        label={t('inventory.filterDateRange')}
        options={rangeOptions
          .filter((o) => o.value !== 'all')
          .map((o) => ({ value: o.value, label: t(o.labelKey) }))}
        selected={movementRange === 'all' ? [] : [movementRange]}
        onChange={(next) =>
          onMovementRangeChange((next.find((v) => v !== movementRange) ?? 'all') as MovementRange)
        }
      />
    </FilterToolbar>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {filters}
        <SectionCard className="space-y-3 p-4" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-20 w-full rounded-md bg-muted" />
          ))}
        </SectionCard>
      </div>
    )
  }

  if (loadedCount === 0) {
    return (
      <SectionCard className="p-10 text-center">
        <div className="attendance-history-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <History className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground">{t('inventory.noMovements')}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          {t('inventory.noMovementsHint')}
        </p>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      {filters}

      {movements.length === 0 ? (
        <SectionCard className="p-10 text-center">
          <div className="attendance-history-empty-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <History className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">{t('inventory.noMovementsFiltered')}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {t('inventory.noMovementsFilteredHint')}
          </p>
        </SectionCard>
      ) : (
        <SectionCard className="space-y-3 p-4">
          {movements.map((movement, index) => {
            const Icon = typeIcons[movement.type]
            const isInbound = movement.quantity > 0

            return (
              <article
                key={movement.id}
                className="rounded-2xl border border-border p-4"
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
        </SectionCard>
      )}

    </div>
  )
}
