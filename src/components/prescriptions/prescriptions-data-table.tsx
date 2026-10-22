'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ClipboardPen,
  FileText,
} from 'lucide-react'
import type { Prescription } from '@/types'
import type { PrescriptionSortDirection, PrescriptionSortField } from '@/types/prescription-page'
import { PrescriptionsCompactSkeleton, PrescriptionsTableSkeleton } from '@/components/prescriptions/prescriptions-skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

interface PrescriptionsDataTableProps {
  exams: Prescription[]
  loading?: boolean
  refreshing?: boolean
  sortField: PrescriptionSortField
  sortDirection: PrescriptionSortDirection
  onSort: (field: PrescriptionSortField) => void
  onEnterMarks: (exam: Prescription) => void
  page: number
  totalPages: number
  totalFiltered: number
  pageSize: number
  onPageChange: (page: number) => void
  viewMode: 'table' | 'compact'
}

const sortableColumns: { field: PrescriptionSortField; labelKey: string; className?: string }[] = [
  { field: 'name', labelKey: 'prescriptions.examName' },
  { field: 'term', labelKey: 'prescriptions.term' },
  { field: 'academicYear', labelKey: 'prescriptions.academicYear', className: 'hidden md:table-cell' },
  { field: 'subjects', labelKey: 'prescriptions.subjects' },
]

function handleRowKeyDown(event: React.KeyboardEvent, onActivate: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

function PrescriptionRowActions({
  exam,
  onEnterMarks,
  t,
}: {
  exam: Prescription
  onEnterMarks: (exam: Prescription) => void
  t: (key: string, params?: Record<string, string | number>) => string
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
        aria-label={`Enter marks for ${exam.name}`}
        onClick={() => onEnterMarks(exam)}
      >
        <ClipboardPen className="h-4 w-4" />
      </Button>
    </div>
  )
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: PrescriptionSortField
  sortField: PrescriptionSortField
  sortDirection: PrescriptionSortDirection
}) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-[hsl(var(--metric-prescriptions))]" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-[hsl(var(--metric-prescriptions))]" />
  )
}

export function PrescriptionsDataTable({
  exams,
  loading,
  refreshing,
  sortField,
  sortDirection,
  onSort,
  onEnterMarks,
  page,
  totalPages,
  totalFiltered,
  pageSize,
  onPageChange,
  viewMode,
}: PrescriptionsDataTableProps) {
  const start = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalFiltered)
  const showSkeleton = loading && exams.length === 0

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
              <PrescriptionsCompactSkeleton rows={pageSize} />
            </div>
          ) : exams.length === 0 ? (
            <div className="clinic-table-empty col-span-full">{'No prescriptions found. Create one or adjust your filters.'}</div>
          ) : (
            exams.map((exam, index) => (
              <div
                key={exam.id}
                role="button"
                tabIndex={0}
                className="clinic-compact-card clinic-compact-card-clickable clinic-list-item-enter group cursor-pointer"
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => onEnterMarks(exam)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onEnterMarks(exam))}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="exams-avatar flex h-10 w-10 items-center justify-center rounded-xl">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.term} · {exam.academicYear}
                      </p>
                    </div>
                  </div>
                  <span className="exams-count-pill text-xs">
                    {`${exam.subjects.length} subjects`}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {exam.subjects.slice(0, 3).map((subject) => (
                    <span key={subject} className="exams-subject-pill text-[10px]">
                      {subject}
                    </span>
                  ))}
                  {exam.subjects.length > 3 && (
                    <span className="exams-subject-pill text-[10px]">
                      +{exam.subjects.length - 3}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{`Max ${exam.maxScore}`}</span>
                  <span>{`Pass ${exam.passScore}`}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="clinic-table-shell overflow-hidden rounded-[20px] border">
          <PrescriptionsPagination
            loading={showSkeleton}
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
        'clinic-table-shell overflow-hidden rounded-[20px] border',
        refreshing && 'pointer-events-none opacity-60'
      )}
      aria-busy={loading || undefined}
    >
      <table className="clinic-table w-full">
        <thead>
          <tr className="clinic-table-head">
            {sortableColumns.map((col) => (
              <th key={col.field} className={col.className}>
                <button
                  type="button"
                  className="clinic-table-sort-btn"
                  onClick={() => onSort(col.field)}
                  disabled={loading}
                >
                  {t(col.labelKey)}
                  <SortIcon field={col.field} sortField={sortField} sortDirection={sortDirection} />
                </button>
              </th>
            ))}
            <th className="hidden lg:table-cell">{'Pass score'}</th>
            <th className="hidden xl:table-cell">{'Max score'}</th>
            <th className="w-[4.5rem] text-right">{'Actions'}</th>
          </tr>
        </thead>
        <tbody key={page}>
          {showSkeleton ? (
            <PrescriptionsTableSkeleton rows={pageSize} />
          ) : exams.length === 0 ? (
            <tr>
              <td colSpan={7} className="clinic-table-empty">
                {'No prescriptions found. Create one or adjust your filters.'}
              </td>
            </tr>
          ) : (
            exams.map((exam, index) => (
              <tr
                key={exam.id}
                tabIndex={0}
                className="clinic-table-row clinic-table-row-clickable clinic-list-item-enter group cursor-pointer"
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => onEnterMarks(exam)}
                onKeyDown={(e) => handleRowKeyDown(e, () => onEnterMarks(exam))}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="exams-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{exam.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {exam.subjects.join(', ')}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="clinic-category-pill text-xs">{exam.term}</span>
                </td>
                <td className="hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">{exam.academicYear}</span>
                </td>
                <td>
                  <span className="exams-count-pill text-xs">
                    {exam.subjects.length}
                  </span>
                </td>
                <td className="hidden lg:table-cell">
                  <span className="tabular-nums text-xs">{exam.passScore}</span>
                </td>
                <td className="hidden xl:table-cell">
                  <span className="tabular-nums text-xs text-muted-foreground">{exam.maxScore}</span>
                </td>
                <td>
                  <PrescriptionRowActions exam={exam} onEnterMarks={onEnterMarks} t={t} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <PrescriptionsPagination
        loading={showSkeleton}
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

function PrescriptionsPagination({
  page,
  totalPages,
  start,
  end,
  totalFiltered,
  onPageChange,
  loading,
}: {
  loading?: boolean
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
        {loading ? (
          <span className="animate-pulse inline-block h-3 w-28 rounded-md bg-muted" aria-busy="true" />
        ) : totalFiltered === 0 ? (
          'No results yet'
        ) : (
          `Showing ${start}–${end} of ${totalFiltered}`
        )}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
          const pageNum = i + 1
          return (
            <Button
              key={pageNum}
              variant={pageNum === page ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 w-8 p-0 text-xs', pageNum === page && 'exams-page-btn-active')}
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
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
