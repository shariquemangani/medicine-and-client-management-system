'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Bell, PackageX, TimerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppDispatch, useAppSelector } from '@/redux'
import { loadStockData } from '@/redux/slices'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import type { StockAlert } from '@/types/stock'

const MAX_LISTED = 8

function alertIcon(type: StockAlert['alertType']) {
  if (type === 'out_of_stock') return PackageX
  if (type === 'expired' || type === 'expiring_soon') return TimerOff
  return AlertTriangle
}

/** Header bell: low-stock, out-of-stock and expiry alerts with a link to the ledger. */
export function StockAlertsBell() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isLoading } = useAppSelector((s) => s.auth)
  const { alerts, stats, loading } = useAppSelector((s) => s.stock)

  useEffect(() => {
    if (isLoading || !isAuthenticated || stats || loading) return
    void dispatch(loadStockData())
  }, [dispatch, isAuthenticated, isLoading, stats, loading])

  const critical = alerts.filter((a) => a.severity === 'critical').length
  const label = !stats ? 'Stock alerts' : alerts.length === 0 ? 'Stock alerts: none' : `Stock alerts: ${alerts.length}`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label={label}>
          <Bell className="h-[18px] w-[18px]" />
          {alerts.length > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white',
                critical > 0 ? 'bg-red-500' : 'bg-amber-500'
              )}
              aria-hidden
            >
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Stock alerts</p>
          <p className="text-xs text-muted-foreground">
            {!stats
              ? 'Checking stock…'
              : alerts.length === 0
                ? 'Everything is in stock and in date.'
                : `${alerts.length} item(s) need attention`}
          </p>
        </div>
        {alerts.length > 0 && (
          <ul className="max-h-72 divide-y overflow-y-auto">
            {alerts.slice(0, MAX_LISTED).map((alert) => {
              const Icon = alertIcon(alert.alertType)
              return (
                <li key={alert.id}>
                  <Link
                    href={ROUTES.inventory}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                  >
                    <Icon
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 text-sm text-foreground">{alert.message}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <div className="border-t px-4 py-2.5">
          <Link href={ROUTES.inventory} className="text-xs font-medium text-primary hover:underline">
            {alerts.length > MAX_LISTED ? `View all ${alerts.length} alerts` : 'Open stock & inventory'}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
