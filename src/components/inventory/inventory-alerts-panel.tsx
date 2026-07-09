'use client'

import { AlertCircle, AlertTriangle, PackageX, Timer } from 'lucide-react'
import type { StockAlert, StockItem } from '@/types/stock'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

interface InventoryAlertsPanelProps {
  alerts: StockAlert[]
  loading?: boolean
  onReceive: (stockItemId: string) => void
  onView: (stockItemId: string) => void
}

const alertIcons = {
  low_stock: AlertTriangle,
  critical_stock: AlertCircle,
  out_of_stock: PackageX,
  expiring_soon: Timer,
  expired: AlertCircle,
} as const

const severityStyles = {
  info: 'border-[hsl(var(--metric-attendance)/0.25)] bg-[hsl(var(--metric-attendance)/0.06)]',
  warning: 'border-amber-500/30 bg-amber-500/[0.06]',
  critical: 'border-red-500/30 bg-red-500/[0.06]',
} as const

const iconStyles = {
  info: 'text-[hsl(var(--metric-attendance))] bg-[hsl(var(--metric-attendance)/0.12)]',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/12',
  critical: 'text-red-600 dark:text-red-400 bg-red-500/12',
} as const

export function InventoryAlertsPanel({
  alerts,
  loading,
  onReceive,
  onView,
}: InventoryAlertsPanelProps) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-skeleton h-28 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="attendance-record-empty rounded-2xl border p-10 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-emerald-500/70" />
        <p className="mt-3 text-sm font-medium text-foreground">{t('inventory.noAlerts')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('inventory.noAlertsHint')}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {alerts.map((alert, index) => {
        const Icon = alertIcons[alert.alertType]
        const canReceive =
          alert.alertType === 'low_stock' ||
          alert.alertType === 'critical_stock' ||
          alert.alertType === 'out_of_stock'

        return (
          <article
            key={alert.id}
            className={cn(
              'clinic-list-item-enter rounded-2xl border p-4 transition-all duration-200',
              severityStyles[alert.severity]
            )}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  iconStyles[alert.severity]
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{alert.medicineName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[alert.formType, alert.potency].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-2 text-sm text-foreground">{alert.message}</p>
                {alert.expiryDate ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t('inventory.expiry')}: {alert.expiryDate}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="attendance-hero-btn h-8 text-xs"
                    onClick={() => onView(alert.stockItemId)}
                  >
                    {t('inventory.viewItem')}
                  </Button>
                  {canReceive ? (
                    <Button
                      size="sm"
                      className="attendance-hero-primary h-8 text-xs"
                      onClick={() => onReceive(alert.stockItemId)}
                    >
                      {t('inventory.receiveStock')}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function findStockItemById(items: StockItem[], id: string): StockItem | null {
  return items.find((item) => item.id === id) ?? null
}
