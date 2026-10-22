'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

interface DataTablePaginationProps {
  page: number
  totalPages: number
  start: number
  end: number
  totalFiltered: number
  onPageChange: (page: number) => void
  emptyLabelKey: string
  rangeLabelKey: string
  activePageClassName?: string
}

export function DataTablePagination({
  page,
  totalPages,
  start,
  end,
  totalFiltered,
  onPageChange,
  emptyLabelKey,
  rangeLabelKey,
  activePageClassName = 'patients-page-btn-active',
}: DataTablePaginationProps) {

  return (
    <div className="clinic-pagination flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {totalFiltered === 0
          ? t(emptyLabelKey)
          : t(rangeLabelKey, { start, end, total: totalFiltered })}
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
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          // Sliding window of up to 5 pages centred on the current page.
          const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4))
          const pageNum = windowStart + i
          return (
            <Button
              key={pageNum}
              variant={pageNum === page ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 w-8 p-0 text-xs', pageNum === page && activePageClassName)}
              aria-label={`Page ${pageNum}`}
              aria-current={pageNum === page ? 'page' : undefined}
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
