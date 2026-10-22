'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/shared'
import type { PatientBillingSummary } from '@/types'
import { cn } from '@/lib/utils'
import { getTranslatedClassName } from '@/lib/patient-display'
import { formatAmount } from '@/lib/patient-stats'
import { FeesTableSkeleton } from './billing-skeleton'

interface BillingBalancesPanelProps {
  summaries: PatientBillingSummary[]
  loading?: boolean
  search: string
  onSearchChange: (value: string) => void
  overdueOnly: boolean
  onOverdueOnlyChange: (value: boolean) => void
  onPay: (summary: PatientBillingSummary) => void
  page: number
  totalPages: number
  totalFiltered: number
  start: number
  end: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function BillingBalancesPanel({
  summaries,
  loading,
  search,
  onSearchChange,
  overdueOnly,
  onOverdueOnlyChange,
  onPay,
  page,
  totalPages,
  totalFiltered,
  start,
  end,
  pageSize,
  onPageChange,
}: BillingBalancesPanelProps) {
  const showSkeleton = !!loading

  return (
    <div className="fees-balances space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="fees-search relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={'Search by patient, roll no, or category…'}
            className="fees-input pl-9"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {loading ? (
            <span className="inline-block h-3.5 w-28 animate-pulse rounded-md bg-muted" />
          ) : (
            <span>{`Showing ${totalFiltered} accounts`}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOverdueOnlyChange(false)}
          className={cn(
            'fees-filter-chip rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
            !overdueOnly && 'fees-filter-chip-active'
          )}
        >
          {'All Accounts'}
        </button>
        <button
          type="button"
          onClick={() => onOverdueOnlyChange(true)}
          className={cn(
            'fees-filter-chip rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
            overdueOnly && 'fees-filter-chip-active'
          )}
        >
          {'Overdue Only'}
        </button>
      </div>

      <div className="clinic-table-shell overflow-x-auto rounded-xl border">
        <table className="clinic-table w-full">
          <thead>
            <tr className="clinic-table-head">
              <th>{'Patient'}</th>
              <th>{'Group'}</th>
              <th>{'Due'}</th>
              <th>{'Paid'}</th>
              <th>{'Balance'}</th>
              <th className="hidden md:table-cell">{'Last Payment'}</th>
              <th className="w-[5rem] text-right">{'Actions'}</th>
            </tr>
          </thead>
          <tbody key={page} aria-busy={loading || undefined}>
            {showSkeleton ? (
              <FeesTableSkeleton rows={pageSize} />
            ) : summaries.length === 0 ? (
              <tr>
                <td colSpan={7} className="clinic-table-empty">
                  {'No accounts match your filters'}
                </td>
              </tr>
            ) : (
              summaries.map((s) => (
                <tr
                  key={s.patientId}
                  className={cn(
                    'clinic-table-row',
                    s.isOverdue && s.balance > 0 && 'fees-table-row-overdue'
                  )}
                >
                  <td>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{s.patientName}</p>
                      <p className="text-[11px] text-muted-foreground">{s.rollNumber}</p>
                    </div>
                  </td>
                  <td>
                    <span className="clinic-category-pill text-xs">
                      {getTranslatedClassName(s.className)}
                    </span>
                  </td>
                  <td className="tabular-nums">{formatAmount(s.totalDue)}</td>
                  <td className="tabular-nums">{formatAmount(s.totalPaid)}</td>
                  <td
                    className={cn(
                      'tabular-nums font-semibold',
                      s.balance > 0 ? 'text-[hsl(var(--metric-billing))]' : 'text-foreground'
                    )}
                  >
                    {formatAmount(s.balance)}
                  </td>
                  <td className="hidden md:table-cell text-muted-foreground">
                    {s.lastPaymentDate ?? '—'}
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        className="fees-pay-btn h-8"
                        disabled={s.balance <= 0}
                        onClick={() => onPay(s)}
                      >
                        {'Pay'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {loading ? (
          <div className="clinic-pagination border-t px-4 py-3">
            <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
          </div>
        ) : (
          <DataTablePagination
            page={page}
            totalPages={totalPages}
            start={start}
            end={end}
            totalFiltered={totalFiltered}
            onPageChange={onPageChange}
            emptyLabelKey="billing.noResults"
            rangeLabelKey="billing.showingRange"
          />
        )}
      </div>
    </div>
  )
}
