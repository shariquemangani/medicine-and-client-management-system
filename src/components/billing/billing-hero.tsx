'use client'

import { Wallet, RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero, heroButtonClass } from '@/components/shared/page-hero'

interface BillingHeroProps {
  loading?: boolean
  totalAccounts: number
  outstanding: number
  onRefresh: () => void
  onExport?: () => void
  refreshing?: boolean
}

export function BillingHero({ loading, totalAccounts, outstanding, onRefresh, onExport, refreshing }: BillingHeroProps) {
  return (
    <PageHero
      icon={Wallet}
      badge="Finance"
      title="Billing & Payments"
      subtitle={
        loading ? (
          <span className="inline-block h-4 w-56 max-w-full animate-pulse rounded-md bg-muted align-middle" aria-hidden />
        ) : (
          `${totalAccounts} accounts · ₹${Math.round(outstanding).toLocaleString('en-IN')} outstanding`
        )
      }
      actions={
        <>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {'Refresh'}
          </Button>
          <Button variant="outline" size="sm" className={heroButtonClass} onClick={onExport} disabled={!onExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {'Export'}
          </Button>
        </>
      }
    />
  )
}
