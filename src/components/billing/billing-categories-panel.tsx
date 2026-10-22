'use client'

import type { BillingCategory } from '@/types'
import { formatAmount } from '@/lib/patient-stats'

interface BillingCategoriesPanelProps {
  categories: BillingCategory[]
  loading?: boolean
}

export function BillingCategoriesPanel({ categories, loading }: BillingCategoriesPanelProps) {
  const showSkeleton = !!loading

  return (
    <div className="clinic-table-shell overflow-hidden rounded-xl border">
      <table className="clinic-table w-full">
        <thead>
          <tr className="clinic-table-head">
            <th>{'Category'}</th>
            <th>{'Description'}</th>
            <th className="text-right">{'Default Amount'}</th>
          </tr>
        </thead>
        <tbody aria-busy={showSkeleton || undefined}>
          {showSkeleton ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="clinic-table-row">
                  <td><div className="animate-pulse bg-muted h-3 w-24 rounded-md" /></td>
                  <td><div className="animate-pulse bg-muted h-3 w-40 rounded-md" /></td>
                  <td><div className="animate-pulse bg-muted ml-auto h-3 w-16 rounded-md" /></td>
                </tr>
              ))}
            </>
          ) : categories.length === 0 ? (
            <tr>
              <td colSpan={3} className="clinic-table-empty">
                {'No fee categories configured'}
              </td>
            </tr>
          ) : (
            categories.map((c) => (
              <tr key={c.id} className="clinic-table-row">
                <td className="font-medium text-foreground">{c.name}</td>
                <td className="text-muted-foreground">{c.description ?? '—'}</td>
                <td className="text-right tabular-nums font-medium">
                  {formatAmount(c.defaultAmount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
