'use client'

import { ROUTES } from '@/lib/routes'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MedicinesHero,
  MedicinesFilters,
  MedicinesDataTable,
  MedicinesDeleteDialog,
} from '@/components/medicines'
import { useMedicinesDirectory } from '@/hooks/use-medicines-directory'
import { deleteMedicine } from '@/services/pharmacy-api'
import type { Medicine } from '@/types'
import { toast } from 'sonner'
import { BentoGrid, BentoCard } from '@/components/shared'

type ClassWithCount = Medicine & { patientCount?: number }

export default function MedicinesListPage() {
  const router = useRouter()
  const {
    initialLoading,
    refreshing,
    filters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    sortField,
    sortDirection,
    toggleSort,
    stats,
    paginatedClasses,
    page,
    setPage,
    totalPages,
    pageSize,
    totalFiltered,
    reload,
  } = useMedicinesDirectory()

  const [deleteTarget, setDeleteTarget] = useState<ClassWithCount | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table')

  const openView = (cls: ClassWithCount) => {
    router.push(ROUTES.vaultMedicineDetail(cls.id))
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMedicine(deleteTarget.id)
      toast.success('Medicine deleted')
      setDeleteTarget(null)
      reload()
    } catch {
      toast.error('Failed to delete medicine')
      throw new Error('delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="classes-page dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <MedicinesHero
            onRefresh={reload}
            refreshing={refreshing}
            onAdd={() => router.push(ROUTES.vaultMedicineNew)}
          />
        </BentoCard>

        <BentoCard colSpan={12} delay={120}>
          <MedicinesFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
            totalFiltered={totalFiltered}
            total={stats.total}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <div className="mt-4">
            <MedicinesDataTable
              classes={paginatedClasses}
              loading={initialLoading}
              refreshing={refreshing}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              onView={openView}
              onDelete={setDeleteTarget}
              page={page}
              totalPages={totalPages}
              totalFiltered={totalFiltered}
              pageSize={pageSize}
              onPageChange={setPage}
              viewMode={viewMode}
            />
          </div>
        </BentoCard>
      </BentoGrid>

      <MedicinesDeleteDialog
        target={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  )
}
