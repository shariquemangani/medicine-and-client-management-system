import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
  className?: string
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [5, 8, 10, 15, 20],
  className = '',
}: PaginationControlsProps) {
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  // Don't render pagination if there's only one page or no items
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <div className="flex gap-1">
          {(() => {
            const pages: React.ReactElement[] = []

            // Function to add page button
            const addPageButton = (pageNum: number) => {
              pages.push(
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    isActive={currentPage === pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className="w-10 h-10"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            }

            // Function to add ellipsis
            const addEllipsis = (key: string) => {
              pages.push(
                <PaginationItem key={key}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            }

            // Always show first page
            if (totalPages >= 1) {
              addPageButton(1)
            }

            // Calculate range around current page
            const startPage = Math.max(2, currentPage - 1)
            const endPage = Math.min(totalPages - 1, currentPage + 1)

            // Show ellipsis after page 1 if needed
            if (startPage > 2) {
              addEllipsis('ellipsis-start')
            }

            // Show pages around current page
            for (let i = startPage; i <= endPage; i++) {
              if (i !== 1 && i !== totalPages) {
                // Don't duplicate first and last pages
                addPageButton(i)
              }
            }

            // Show ellipsis before last page if needed
            if (endPage < totalPages - 1) {
              addEllipsis('ellipsis-end')
            }

            // Show last page if it exists and isn't already shown
            if (totalPages >= 2 && totalPages !== 1) {
              addPageButton(totalPages)
            }

            return (
              <Pagination>
                <PaginationContent>{pages}</PaginationContent>
              </Pagination>
            )
          })()}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>

        {showItemsPerPage && (
          <Select
            value={String(itemsPerPage)}
            onValueChange={value => {
              onItemsPerPageChange(Number(value))
              onPageChange(1) // Reset to first page when changing items per page
            }}
          >
            <SelectTrigger className="w-[70px] h-9">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map(option => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Page info */}
      <div className="text-center text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
        {totalItems > 0 && ` • ${totalItems} total items`}
      </div>
    </div>
  )
}
