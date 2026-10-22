'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  BookOpen,
  Pill,
} from 'lucide-react'
import type { Medicine } from '@/types'
import type { MedicineSortDirection, MedicineSortField } from '@/types/medicine-page'
import { MedicinesCompactSkeleton, MedicinesTableSkeleton } from '@/components/medicines/medicines-skeleton'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/use-permission'
import { cn } from '@/lib/utils'
import { getMedicineInformation } from '@/lib/medicines/medicine-form'
import { t } from '@/lib/labels'
import { Skel } from '@/components/medicines/skeleton-bits'

interface MedicinesDataTableProps {
  medicines: Medicine[]
  loading?: boolean
  refreshing?: boolean
  sortField: MedicineSortField
  sortDirection: MedicineSortDirection
  onSort: (field: MedicineSortField) => void
  onView: (medicine: Medicine) => void
  onDelete: (medicine: Medicine) => void
  page: number
  totalPages: number
  totalFiltered: number
  pageSize: number
  onPageChange: (page: number) => void
  viewMode: 'table' | 'compact'
}

function handleRowKeyDown(event: React.KeyboardEvent, onActivate: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function getMedicineListSubtitle(medicine: Medicine) {
  const info = getMedicineInformation(medicine)
  const parts = [medicine.commonName, info].map((part) => part?.trim()).filter(Boolean)

  if (parts.length > 0) return parts.join(' · ')
  return t('medicines.detail.emptyField')
}

function MedicineRowActions({
  medicine,
  onView,
  onDelete,
}: {
  medicine: Medicine
  onView: (medicine: Medicine) => void
  onDelete: (medicine: Medicine) => void
}) {
  const { hasPermission } = usePermission()
  const canDelete = hasPermission('medicines', 'delete')
  return (
    <div
      className="clinic-table-actions flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="clinic-table-action h-8 w-8"
        aria-label={`View ${medicine.name}`}
        onClick={() => onView(medicine)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="clinic-table-action clinic-table-action-delete h-8 w-8"
          aria-label={`Delete ${medicine.name}`}
          onClick={() => onDelete(medicine)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: MedicineSortField
  sortField: MedicineSortField
  sortDirection: MedicineSortDirection
}) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-[hsl(var(--metric-medicines))]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[hsl(var(--metric-medicines))]" />
  )
}

export function MedicinesDataTable({
  medicines,
  loading,
  refreshing,
  sortField,
  sortDirection,
  onSort,
  onView,
  onDelete,
  page,
  totalPages,
  totalFiltered,
  pageSize,
  onPageChange,
  viewMode,
}: MedicinesDataTableProps) {
  const start = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalFiltered)
  const showSkeleton = loading && medicines.length === 0

  if (viewMode === 'compact') {
    return (
      <div className="space-y-3">
        <div
          className={cn('clinic-compact-grid', refreshing && 'pointer-events-none opacity-60')}
          key={page}
          aria-busy={loading || undefined}
        >
          {showSkeleton ? (
            <div className="col-span-full">
              <MedicinesCompactSkeleton rows={pageSize} />
            </div>
          ) : medicines.length === 0 ? (
            <div className="clinic-table-empty col-span-full">
              {t('medicines.listEmpty')}
              <Link
                href={ROUTES.vaultMedicineNew}
                className="mt-2 block font-medium text-primary underline underline-offset-2"
              >
                {t('medicines.addMedicine')}
              </Link>
            </div>
          ) : (
            medicines.map((medicine) => (
              <div
                key={medicine.id}
                role="button"
                tabIndex={0}
                className="clinic-compact-card clinic-compact-card-clickable group cursor-pointer"
                onClick={() => onView(medicine)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onView(medicine))}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="classes-avatar flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{medicine.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getMedicineListSubtitle(medicine)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <MedicineRowActions medicine={medicine} onView={onView} onDelete={onDelete} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="clinic-table-shell overflow-hidden rounded-[20px] border">
          <MedicinesPagination
            page={page}
            totalPages={totalPages}
            start={start}
            end={end}
            totalFiltered={totalFiltered}
            onPageChange={onPageChange}
            loading={showSkeleton}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'clinic-table-shell overflow-hidden rounded-[20px] border',
        refreshing && 'pointer-events-none opacity-60'
      )}
      aria-busy={loading || undefined}
    >
      <table className="clinic-table w-full">
        <thead>
          <tr className="clinic-table-head">
            <th>
              <button
                type="button"
                className="clinic-table-sort-btn"
                onClick={() => onSort('name')}
                disabled={loading}
              >
                {t('medicines.medicineName')}
                <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </th>
            <th>{t('medicines.information')}</th>
            <th className="w-[4.5rem] text-right">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody key={page}>
          {showSkeleton ? (
            <MedicinesTableSkeleton rows={pageSize} />
          ) : medicines.length === 0 ? (
            <tr>
              <td colSpan={3} className="clinic-table-empty">
                {t('medicines.listEmpty')}
              <Link
                href={ROUTES.vaultMedicineNew}
                className="mt-2 block font-medium text-primary underline underline-offset-2"
              >
                {t('medicines.addMedicine')}
              </Link>
              </td>
            </tr>
          ) : (
            medicines.map((medicine) => (
              <tr
                key={medicine.id}
                tabIndex={0}
                className="clinic-table-row clinic-table-row-clickable group cursor-pointer"
                onClick={() => onView(medicine)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onView(medicine))}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="classes-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{medicine.name}</p>
                      {medicine.commonName ? (
                        <p className="truncate text-xs italic text-muted-foreground">
                          {medicine.commonName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {getMedicineInformation(medicine) || '—'}
                  </span>
                </td>
                <td>
                  <MedicineRowActions medicine={medicine} onView={onView} onDelete={onDelete} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <MedicinesPagination
        page={page}
        totalPages={totalPages}
        start={start}
        end={end}
        totalFiltered={totalFiltered}
        onPageChange={onPageChange}
        loading={showSkeleton}
      />
    </div>
  )
}

function MedicinesPagination({
  page,
  totalPages,
  start,
  end,
  totalFiltered,
  onPageChange,
  loading,
}: {
  page: number
  totalPages: number
  start: number
  end: number
  totalFiltered: number
  onPageChange: (page: number) => void
  loading?: boolean
}) {
  return (
    <div className="clinic-pagination flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {loading ? (
          <Skel className="h-3.5 w-40" />
        ) : totalFiltered === 0
          ? t('medicines.noResults')
          : t('medicines.listPagination', { start, end, total: totalFiltered })}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={loading || page <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages })
          .slice(0, 5)
          .map((_, i) => {
            const pageNum = i + 1
            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'default' : 'outline'}
                size="sm"
                className={cn('h-8 w-8 p-0 text-xs', pageNum === page && 'classes-page-btn-active')}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={loading || page >= totalPages}
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
