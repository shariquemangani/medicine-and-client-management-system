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
import type { ClassSortDirection, ClassSortField } from '@/types/medicine-page'
import { MedicinesCompactSkeleton, MedicinesTableSkeleton } from '@/components/medicines/medicines-skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getTranslatedClassName } from '@/lib/patient-display'

type ClassWithCount = Medicine & { patientCount?: number }

interface MedicinesDataTableProps {
  classes: ClassWithCount[]
  loading?: boolean
  refreshing?: boolean
  sortField: ClassSortField
  sortDirection: ClassSortDirection
  onSort: (field: ClassSortField) => void
  onView: (cls: ClassWithCount) => void
  onDelete: (cls: ClassWithCount) => void
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

function getMedicineInformation(cls: ClassWithCount) {
  const parts = [cls.grade, cls.section, cls.scheduleSummary]
    .map((part) => part?.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'No information'
}

function ClassRowActions({
  cls,
  onView,
  onDelete,
}: {
  cls: ClassWithCount
  onView: (cls: ClassWithCount) => void
  onDelete: (cls: ClassWithCount) => void
}) {
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
        aria-label={`View ${cls.name}`}
        onClick={() => onView(cls)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="clinic-table-action clinic-table-action-delete h-8 w-8"
        aria-label={`Delete ${cls.name}`}
        onClick={() => onDelete(cls)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: ClassSortField
  sortField: ClassSortField
  sortDirection: ClassSortDirection
}) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-[hsl(var(--metric-medicines))]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[hsl(var(--metric-medicines))]" />
  )
}

export function MedicinesDataTable({
  classes,
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
  const showSkeleton = loading && classes.length === 0

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
          ) : classes.length === 0 ? (
            <div className="clinic-table-empty col-span-full">{'No medicines match your filters'}</div>
          ) : (
            classes.map((cls, index) => (
              <div
                key={cls.id}
                role="button"
                tabIndex={0}
                className="clinic-compact-card clinic-compact-card-clickable clinic-list-item-enter group cursor-pointer"
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => onView(cls)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onView(cls))}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="classes-avatar flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {getTranslatedClassName(cls.name)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getMedicineInformation(cls)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <ClassRowActions cls={cls} onView={onView} onDelete={onDelete} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="clinic-table-shell overflow-hidden rounded-xl border">
          <MedicinesPagination
            page={page}
            totalPages={totalPages}
            start={start}
            end={end}
            totalFiltered={totalFiltered}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'clinic-table-shell overflow-hidden rounded-xl border',
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
                {'Medicine Name'}
                <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </th>
            <th>{'Information'}</th>
            <th className="w-[4.5rem] text-right">{'Actions'}</th>
          </tr>
        </thead>
        <tbody key={page}>
          {showSkeleton ? (
            <MedicinesTableSkeleton rows={pageSize} />
          ) : classes.length === 0 ? (
            <tr>
              <td colSpan={3} className="clinic-table-empty">
                {'No medicines match your filters'}
              </td>
            </tr>
          ) : (
            classes.map((cls, index) => (
              <tr
                key={cls.id}
                tabIndex={0}
                className="clinic-table-row clinic-table-row-clickable clinic-list-item-enter group cursor-pointer"
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => onView(cls)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onView(cls))}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="classes-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <p className="truncate font-medium text-foreground">
                      {getTranslatedClassName(cls.name)}
                    </p>
                  </div>
                </td>
                <td>
                  <span className="truncate text-sm text-muted-foreground">
                    {getMedicineInformation(cls)}
                  </span>
                </td>
                <td>
                  <ClassRowActions cls={cls} onView={onView} onDelete={onDelete} />
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
}: {
  page: number
  totalPages: number
  start: number
  end: number
  totalFiltered: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="clinic-pagination flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {totalFiltered === 0
          ? 'No results'
          : `Showing ${start}–${end} of ${totalFiltered}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page <= 1}
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
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
