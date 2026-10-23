'use client'

import { Search, Wallet } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  DataTablePagination,
  FilterToolbar,
  MemberCell,
  Pill,
  SectionCard,
  SectionCardHeader,
  Td,
  Th,
  THead,
  ToggleChip,
  Tr,
} from '@/components/shared'
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
      <FilterToolbar
        count={
          loading ? (
            <span className="inline-block h-3.5 w-20 animate-pulse rounded-md bg-muted align-middle" />
          ) : (
            `${totalFiltered} account${totalFiltered === 1 ? '' : 's'}`
          )
        }
      >
        <div className="fees-search relative w-full min-w-0 sm:w-auto sm:max-w-sm sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={'Search by patient, roll no, or category…'}
            aria-label="Search accounts"
            className="fees-input h-8 rounded-xl pl-9 text-xs"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <ToggleChip label="Overdue only" checked={overdueOnly} onChange={onOverdueOnlyChange} />
      </FilterToolbar>

      <SectionCard>
        <SectionCardHeader title="Balances" description="Patient fee balances" icon={<Wallet className="h-4 w-4" />} accent="fees" />
        <DataTable>
          <THead>
            <tr>
              <Th>{'Patient'}</Th>
              <Th>{'Group'}</Th>
              <Th>{'Due'}</Th>
              <Th>{'Paid'}</Th>
              <Th>{'Balance'}</Th>
              <Th className="hidden md:table-cell">{'Last Payment'}</Th>
              <Th className="w-[5rem] text-right">{'Actions'}</Th>
            </tr>
          </THead>
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
                <Tr
                  key={s.patientId}
                  className={cn(s.isOverdue && s.balance > 0 && 'fees-table-row-overdue')}
                >
                  <Td className="min-w-[200px]">
                    <MemberCell name={s.patientName} secondary={s.rollNumber} />
                  </Td>
                  <Td>
                    <Pill>{getTranslatedClassName(s.className)}</Pill>
                  </Td>
                  <Td className="tabular-nums">{formatAmount(s.totalDue)}</Td>
                  <Td className="tabular-nums">{formatAmount(s.totalPaid)}</Td>
                  <Td
                    className={cn(
                      'tabular-nums font-semibold',
                      s.balance > 0 ? 'text-[hsl(var(--metric-billing-text))]' : 'text-foreground'
                    )}
                  >
                    {formatAmount(s.balance)}
                  </Td>
                  <Td className="hidden text-muted-foreground md:table-cell">{s.lastPaymentDate ?? '—'}</Td>
                  <Td>
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
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </DataTable>
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
      </SectionCard>
    </div>
  )
}
