'use client'

import type { BillingCategory } from '@/types'
import { DataTable, SectionCard, SectionCardHeader, Td, Th, THead, Tr } from '@/components/shared'
import { formatAmount } from '@/lib/patient-stats'

interface BillingCategoriesPanelProps {
  categories: BillingCategory[]
  loading?: boolean
}

export function BillingCategoriesPanel({ categories, loading }: BillingCategoriesPanelProps) {
  const showSkeleton = !!loading

  return (
    <SectionCard>
      <SectionCardHeader title="Categories" description="Fee categories and their default amounts" />
      <DataTable>
        <THead>
          <tr>
            <Th>{'Category'}</Th>
            <Th>{'Description'}</Th>
            <Th className="text-right">{'Default Amount'}</Th>
          </tr>
        </THead>
        <tbody aria-busy={showSkeleton || undefined}>
          {showSkeleton ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Tr key={i}>
                  <Td><div className="animate-pulse bg-muted h-3 w-24 rounded-md" /></Td>
                  <Td><div className="animate-pulse bg-muted h-3 w-40 rounded-md" /></Td>
                  <Td><div className="animate-pulse bg-muted ml-auto h-3 w-16 rounded-md" /></Td>
                </Tr>
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
              <Tr key={c.id}>
                <Td className="font-medium text-foreground">{c.name}</Td>
                <Td className="text-muted-foreground">{c.description ?? '—'}</Td>
                <Td className="text-right tabular-nums font-medium">
                  {formatAmount(c.defaultAmount)}
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </DataTable>
    </SectionCard>
  )
}
