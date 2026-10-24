'use client'

import { useEffect, useState } from 'react'
import { ROUTES } from '@/lib/routes'
import { useRouter } from 'next/navigation'
import { Users, Wallet } from 'lucide-react'
import { BentoGrid, BentoCard } from '@/components/shared'
import { DashboardStatTile } from '@/components/dashboard'
import {
  PatientsHero,
  PatientsFilters,
  PatientsDataTable,
  PatientsDeleteDialog,
} from '@/components/patients'
import { usePatientsDirectory } from '@/hooks/use-patients-directory'
import { downloadCsv } from '@/lib/download-csv'
import { deletePatientApi } from '@/services/patient-api'
import type { Patient } from '@/types'
import { toast } from 'sonner'

export default function PatientsPage() {
  const router = useRouter()
  const {
    initialLoading,
    refreshing,
    error,
    filters,
    searchInput,
    setSearchInput,
    applySearch,
    clearSearch,
    searchHighlight,
    updateFilter,
    clearFilters,
    activeFilterCount,
    sortField,
    sortDirection,
    toggleSort,
    stats,
    paginatedPatients,
    sortedPatients,
    page,
    setPage,
    totalPages,
    pageSize,
    totalFiltered,
    availableYears,
    reload,
  } = usePatientsDirectory()

  const exportPatients = () => {
    if (sortedPatients.length === 0) {
      toast.error('No patients to export')
      return
    }
    downloadCsv(`patients-${new Date().toISOString().split('T')[0]}.csv`, [
      ['Roll No', 'First Name', 'Last Name', 'Phone', 'Address', 'Status', 'Fees', 'Registered'],
      ...sortedPatients.map((p) => [
        p.rollNumber,
        p.firstName,
        p.lastName,
        p.phone ?? '',
        p.address ?? '',
        p.status,
        p.fees ?? '',
        p.createdAt ?? '',
      ]),
    ])
  }

  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'compact'>('table')
  // Phones get the card layout by default (a wide table would need sideways scrolling).
  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) setViewMode('compact')
  }, [])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePatientApi(deleteTarget.id)
      setDeleteTarget(null)
      await reload()
      toast.success('Patient deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete patient')
      throw new Error('delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="dashboard-shell patients-page space-y-4">
      <BentoGrid>
        <div className="col-span-full">
          <PatientsHero
            total={stats.total}
            active={stats.total}
            onExport={exportPatients}
            onRefresh={reload}
            refreshing={refreshing}
            loading={initialLoading}
          />
        </div>

        <BentoCard colSpan={6} accent="patients" delay={60}>
          <DashboardStatTile title="Total Patients" value={initialLoading ? null : stats.total} icon={Users} accent="patients" />
        </BentoCard>
        <BentoCard colSpan={6} accent="fees" delay={120}>
          <DashboardStatTile
            title="Total Amount"
            value={initialLoading ? null : stats.totalAmount}
            icon={Wallet}
            accent="fees"
            currency
          />
        </BentoCard>

      </BentoGrid>

      <div className="space-y-4">
          <PatientsFilters
            filters={filters}
            searchInput={searchInput}
            searchHighlight={searchHighlight}
            onSearchInputChange={setSearchInput}
            onSearchSubmit={applySearch}
            onSearchClear={clearSearch}
            onFilterChange={updateFilter}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
            availableYears={availableYears}
            totalFiltered={totalFiltered}
            total={stats.total}
            totalAmount={stats.totalAmount}
            loading={initialLoading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <div>
            <PatientsDataTable
              patients={paginatedPatients}
              loading={initialLoading}
              refreshing={refreshing || deleting}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              onView={(patient) => router.push(`/patients/${patient.id}`)}
              onDelete={setDeleteTarget}
              page={page}
              totalPages={totalPages}
              totalFiltered={totalFiltered}
              pageSize={pageSize}
              onPageChange={setPage}
              viewMode={viewMode}
              isFiltered={activeFilterCount > 0}
              onAddPatient={() => router.push(ROUTES.patientsNew)}
            />
          </div>
      </div>

      <PatientsDeleteDialog
        patient={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  )
}
