'use client'

import { useEffect, useMemo, useState } from 'react'
import { BentoGrid, BentoCard } from '@/components/shared'
import {
  InventoryHero,
  InventoryStatSkeleton,
  InventoryStatsCards,
  InventoryFilters,
  InventoryStockTable,
  InventoryMovementsPanel,
  InventoryAlertsPanel,
  InventoryReceiveDialog,
  InventoryAdjustDialog,
  InventoryItemFormDialog,
  InventoryDeleteDialog,
  InventoryDetailSheet,
  findStockItemById,
} from '@/components/inventory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MOVEMENT_LOAD_LIMIT, useStockDirectory } from '@/hooks/use-stock-directory'
import type { StockItem } from '@/types/stock'
import { downloadCsv } from '@/lib/download-csv'
import { buildLedgerCsvRows, buildMovementsCsvRows } from '@/lib/stock-export'
import { t } from '@/lib/labels'
import { toast } from 'sonner'

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export default function InventoryPage() {
  const {
    items,
    movements,
    alerts,
    stats,
    initialLoading,
    saving,
    error,
    refreshing,
    filters,
    updateFilter,
    clearFilters,
    activeFilterCount,
    formTypes,
    locations,
    sortField,
    sortDirection,
    toggleSort,
    paginatedItems,
    totalFiltered,
    page,
    setPage,
    totalPages,
    pageSize,
    tab,
    setTab,
    reload,
    receive,
    adjust,
    createItem,
    updateItem,
    removeItem,
    movementType,
    setMovementType,
    movementRange,
    setMovementRange,
    filteredMovements,
    exportItems,
    dismissError,
  } = useStockDirectory()

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<StockItem | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  // Always read the selected item from the store so dialogs see fresh quantities after a save.
  const selectedItem = useMemo(
    () => (selectedId ? findStockItemById(items, selectedId) : null),
    [items, selectedId]
  )

  // Load failures only; mutations toast their own errors.
  useEffect(() => {
    if (error) {
      setLoadFailed(true)
      toast.error(error)
      dismissError()
    }
  }, [error, dismissError])

  const select = (item?: StockItem | null) => setSelectedId(item?.id ?? null)

  const openReceive = (item?: StockItem | null) => {
    select(item)
    setDetailOpen(false)
    setReceiveOpen(true)
  }

  const openAdjust = (item: StockItem) => {
    select(item)
    setDetailOpen(false)
    setAdjustOpen(true)
  }

  const openDetail = (item: StockItem) => {
    select(item)
    setDetailOpen(true)
  }

  const openAdd = () => {
    setEditing(null)
    setDetailOpen(false)
    setFormOpen(true)
  }

  const openEdit = (item: StockItem) => {
    select(item)
    setEditing(item)
    setDetailOpen(false)
    setFormOpen(true)
  }

  const openDelete = (item: StockItem) => {
    select(item)
    setDetailOpen(false)
    setDeleteOpen(true)
  }

  const openFromAlert = (stockItemId: string) => {
    const item = findStockItemById(items, stockItemId)
    if (item) openDetail(item)
  }

  const handleReceive = async (input: Parameters<typeof receive>[0]) => {
    try {
      await receive(input)
      toast.success(t('inventory.receiveSuccess'))
    } catch (err) {
      toast.error(errorMessage(err, t('inventory.receiveFailed')))
      throw err
    }
  }

  const handleAdjust = async (input: Parameters<typeof adjust>[0]) => {
    try {
      await adjust(input)
      toast.success(t('inventory.adjustSuccess'))
    } catch (err) {
      toast.error(errorMessage(err, t('inventory.adjustFailed')))
      throw err
    }
  }

  const handleCreate = async (input: Parameters<typeof createItem>[0]) => {
    try {
      await createItem(input)
      toast.success(t('inventory.itemCreated'))
    } catch (err) {
      toast.error(errorMessage(err, t('inventory.createFailed')))
      throw err
    }
  }

  const handleUpdate = async (id: string, patch: Parameters<typeof updateItem>[1]) => {
    try {
      await updateItem(id, patch)
      toast.success(t('inventory.itemUpdated'))
    } catch (err) {
      toast.error(errorMessage(err, t('inventory.updateFailed')))
      throw err
    }
  }

  const handleDelete = async (item: StockItem) => {
    try {
      await removeItem(item.id)
      toast.success(t('inventory.itemDeleted'))
      setSelectedId(null)
    } catch (err) {
      toast.error(errorMessage(err, t('inventory.deleteFailed')))
      throw err
    }
  }

  const handleExport = () => {
    const exportMovements = tab === 'movements'
    const rows = exportMovements ? buildMovementsCsvRows(filteredMovements) : buildLedgerCsvRows(exportItems)
    const count = rows.length - 1
    if (count <= 0) {
      toast.error(t('inventory.exportEmpty'))
      return
    }
    const stamp = new Date().toISOString().slice(0, 10)
    const base = exportMovements ? t('inventory.exportMovementsFile') : t('inventory.exportLedgerFile')
    downloadCsv(`${base}-${stamp}.csv`, rows)
    toast.success(t('inventory.exportDone', { count }))
  }

  // Static chrome renders at once; only data-backed regions wait on this.
  const dataLoading = !loadFailed && (initialLoading || !stats)

  return (
    <div className="inventory-page dashboard-shell space-y-4">
      <BentoGrid>
        <div className="col-span-full">
          <InventoryHero
            totalSkus={dataLoading || !stats ? null : stats.totalSkus}
            totalValue={dataLoading || !stats ? null : stats.totalValue}
            alertCount={dataLoading || !stats ? null : alerts.length}
            onRefresh={() => {
              reload().catch(() => undefined)
            }}
            onReceive={() => openReceive(null)}
            onAddItem={openAdd}
            onExport={handleExport}
            refreshing={refreshing}
          />
        </div>

        {refreshing || dataLoading || !stats ? (
          <InventoryStatSkeleton />
        ) : (
          <InventoryStatsCards stats={stats} />
        )}

        <div className="min-w-0 sm:col-span-2 lg:col-span-12">
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as typeof tab)}
            className="attendance-tabs"
          >
            <TabsList className="attendance-tabs-list mb-4">
              <TabsTrigger value="ledger" className="attendance-tab-trigger">
                {t('inventory.tabLedger')}
              </TabsTrigger>
              <TabsTrigger value="movements" className="attendance-tab-trigger">
                {t('inventory.tabMovements')}
              </TabsTrigger>
              <TabsTrigger value="alerts" className="attendance-tab-trigger">
                {t('inventory.tabAlerts')}
                {dataLoading ? (
                  <span
                    className="animate-pulse ml-1.5 inline-block h-4 w-5 rounded-full bg-muted align-middle"
                    aria-hidden
                  />
                ) : alerts.length > 0 ? (
                  <span className="ml-1.5 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                    {alerts.length}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ledger">
              {tab === 'ledger' && (
                <div className="space-y-4">
                  {dataLoading || items.length > 0 ? (
                    <InventoryFilters
                      loading={dataLoading}
                      filters={filters}
                      onFilterChange={updateFilter}
                      onClear={clearFilters}
                      activeFilterCount={activeFilterCount}
                      totalFiltered={totalFiltered}
                      total={items.length}
                      formTypes={formTypes}
                      locations={locations}
                    />
                  ) : null}
                  <InventoryStockTable
                    items={paginatedItems}
                    totalItems={items.length}
                    loading={dataLoading}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                    onView={openDetail}
                    onReceive={openReceive}
                    onAdjust={openAdjust}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    onAddItem={openAdd}
                    page={page}
                    totalPages={totalPages}
                    totalFiltered={totalFiltered}
                    pageSize={pageSize}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="movements">
              {tab === 'movements' && (
                <InventoryMovementsPanel
                  movements={filteredMovements}
                  loadedCount={movements.length}
                  loadLimit={MOVEMENT_LOAD_LIMIT}
                  loading={dataLoading}
                  movementType={movementType}
                  onMovementTypeChange={setMovementType}
                  movementRange={movementRange}
                  onMovementRangeChange={setMovementRange}
                />
              )}
            </TabsContent>

            <TabsContent value="alerts">
              {tab === 'alerts' && (
                <InventoryAlertsPanel
                  alerts={alerts}
                  loading={dataLoading}
                  onReceive={(id) => openReceive(findStockItemById(items, id))}
                  onView={openFromAlert}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </BentoGrid>

      <InventoryReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        items={items}
        selectedItem={selectedItem}
        onConfirm={handleReceive}
        onAddItem={openAdd}
        loading={saving}
      />

      <InventoryAdjustDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        item={selectedItem}
        onConfirm={handleAdjust}
        loading={saving}
      />

      <InventoryItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editing}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        loading={saving}
      />

      <InventoryDeleteDialog
        item={selectedItem}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={saving}
      />

      <InventoryDetailSheet
        item={selectedItem}
        movements={movements}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onReceive={openReceive}
        onAdjust={openAdjust}
        onEdit={openEdit}
        onDelete={openDelete}
      />
    </div>
  )
}
