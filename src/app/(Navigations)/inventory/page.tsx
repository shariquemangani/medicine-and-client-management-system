'use client'

import { useEffect, useState } from 'react'
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
  InventoryDetailSheet,
  InventoryPageSkeleton,
  findStockItemById,
} from '@/components/inventory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStockDirectory } from '@/hooks/use-stock-directory'
import type { StockItem } from '@/types/stock'
import { t } from '@/lib/labels'
import { toast } from 'sonner'

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
    dismissError,
  } = useStockDirectory()

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  useEffect(() => {
    if (error) {
      toast.error(error)
      dismissError()
    }
  }, [error, dismissError])

  const openReceive = (item?: StockItem | null) => {
    setSelectedItem(item ?? null)
    setReceiveOpen(true)
  }

  const openAdjust = (item: StockItem) => {
    setSelectedItem(item)
    setAdjustOpen(true)
  }

  const openDetail = (item: StockItem) => {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  const openFromAlert = (stockItemId: string) => {
    const item = findStockItemById(items, stockItemId)
    if (item) openDetail(item)
  }

  const handleReceive = async (input: Parameters<typeof receive>[0]) => {
    try {
      await receive(input)
      toast.success(t('inventory.receiveSuccess'))
    } catch {
      toast.error(t('inventory.receiveFailed'))
      throw new Error('receive failed')
    }
  }

  const handleAdjust = async (input: Parameters<typeof adjust>[0]) => {
    try {
      await adjust(input)
      toast.success(t('inventory.adjustSuccess'))
    } catch {
      toast.error(t('inventory.adjustFailed'))
      throw new Error('adjust failed')
    }
  }

  if (initialLoading || !stats) {
    return <InventoryPageSkeleton />
  }

  return (
    <div className="inventory-page dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <InventoryHero
            totalSkus={stats.totalSkus}
            totalValue={stats.totalValue}
            alertCount={alerts.length}
            onRefresh={reload}
            onReceive={() => openReceive(null)}
            refreshing={refreshing}
          />
        </BentoCard>

        {refreshing ? <InventoryStatSkeleton /> : <InventoryStatsCards stats={stats} />}

        <BentoCard colSpan={12} delay={300}>
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
                {alerts.length > 0 ? (
                  <span className="ml-1.5 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                    {alerts.length}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ledger">
              {tab === 'ledger' && (
                <div className="space-y-4">
                  <InventoryFilters
                    filters={filters}
                    onFilterChange={updateFilter}
                    onClear={clearFilters}
                    activeFilterCount={activeFilterCount}
                    totalFiltered={totalFiltered}
                    total={items.length}
                    formTypes={formTypes}
                    locations={locations}
                  />
                  <InventoryStockTable
                    items={paginatedItems}
                    loading={initialLoading}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                    onView={openDetail}
                    onReceive={openReceive}
                    onAdjust={openAdjust}
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
                <InventoryMovementsPanel movements={movements} loading={initialLoading} />
              )}
            </TabsContent>

            <TabsContent value="alerts">
              {tab === 'alerts' && (
                <InventoryAlertsPanel
                  alerts={alerts}
                  loading={initialLoading}
                  onReceive={(id) => {
                    const item = findStockItemById(items, id)
                    openReceive(item)
                  }}
                  onView={openFromAlert}
                />
              )}
            </TabsContent>
          </Tabs>
        </BentoCard>
      </BentoGrid>

      <InventoryReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        items={items}
        selectedItem={selectedItem}
        onConfirm={handleReceive}
        loading={saving}
      />

      <InventoryAdjustDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        item={selectedItem}
        onConfirm={handleAdjust}
        loading={saving}
      />

      <InventoryDetailSheet
        item={selectedItem}
        movements={movements}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onReceive={openReceive}
        onAdjust={openAdjust}
      />
    </div>
  )
}
