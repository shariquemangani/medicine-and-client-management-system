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
import type { StockMovement } from '@/types/stock'
import { STOCK_MOVEMENT_LABELS } from '@/lib/stock-utils'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

interface InventoryMovementsPanelProps {
  movements: StockMovement[]
  loading?: boolean
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

function formatMovementDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMM d, yyyy · h:mm a')
}

export function InventoryMovementsPanel({ movements, loading }: InventoryMovementsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="dashboard-skeleton h-20 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (movements.length === 0) {
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
    <div className="attendance-history-list space-y-3">
      {movements.map((movement, index) => {
        const Icon = typeIcons[movement.type]
        const isInbound = movement.quantity > 0

        return (
          <article
            key={movement.id}
            className="attendance-history-row clinic-list-item-enter rounded-2xl border p-4"
            style={{ animationDelay: `${index * 35}ms` }}
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
                  <p className="font-semibold text-foreground">{movement.medicineName}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {STOCK_MOVEMENT_LABELS[movement.type]}
                    {movement.batchNumber ? ` · ${movement.batchNumber}` : ''}
                  </p>
                  {movement.notes ? (
                    <p className="mt-1 text-xs text-muted-foreground">{movement.notes}</p>
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
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span>{formatMovementDate(movement.createdAt)}</span>
              {movement.reference ? <span>Ref: {movement.reference}</span> : null}
              {movement.performedBy ? <span>By {movement.performedBy}</span> : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
