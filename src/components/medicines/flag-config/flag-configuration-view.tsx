'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FlagConfigHero } from './flag-config-hero'
import { FlagConfigCategories } from './flag-config-categories'
import { FlagConfigFlagsPanel } from './flag-config-flags-panel'
import {
  FlagCategoryDialog,
  FlagDeleteDialog,
  FlagItemDialog,
} from './flag-config-dialogs'
import { useFlagConfiguration } from '@/hooks/use-flag-configuration'
import type { FlagItem } from '@/types/flag-config'
import { cn } from '@/lib/utils'

export function FlagConfigurationView() {
  const {
    categories,
    selectedCategoryId,
    selectedCategory,
    filteredFlags,
    flagSearch,
    setFlagSearch,
    mobilePane,
    categoriesLoading,
    flagsLoading,
    mutating,
    error,
    selectCategory,
    backToCategories,
    addCategory,
    addFlags,
    updateFlag,
    deleteFlag,
  } = useFlagConfiguration()

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [flagDialogOpen, setFlagDialogOpen] = useState(false)
  const [editingFlag, setEditingFlag] = useState<FlagItem | null>(null)
  const [deletingFlag, setDeletingFlag] = useState<FlagItem | null>(null)

  const openAddFlag = () => {
    setEditingFlag(null)
    setFlagDialogOpen(true)
  }

  const openEditFlag = (flag: FlagItem) => {
    setEditingFlag(flag)
    setFlagDialogOpen(true)
  }

  return (
    <div className="flag-config-shell space-y-4">
      <FlagConfigHero onAddCategory={() => setCategoryDialogOpen(true)} />

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flag-config-workspace overflow-hidden rounded-2xl">
        <div className="grid h-[min(72vh,720px)] min-h-[420px] grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)]">
          <div
            className={cn(
              'border-[hsl(var(--glass-border))] md:border-r',
              mobilePane === 'flags' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
            )}
          >
            <FlagConfigCategories
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={selectCategory}
              loading={categoriesLoading}
              disabled={mutating}
              className="h-full"
            />
          </div>

          <div
            className={cn(
              'min-h-0',
              mobilePane === 'categories' ? 'hidden md:flex md:flex-col' : 'flex flex-col'
            )}
          >
            <FlagConfigFlagsPanel
              category={selectedCategory}
              flags={filteredFlags}
              search={flagSearch}
              onSearchChange={setFlagSearch}
              onAddFlag={openAddFlag}
              onEditFlag={openEditFlag}
              onDeleteFlag={setDeletingFlag}
              onBack={backToCategories}
              showBack
              loading={flagsLoading}
              categoriesLoading={categoriesLoading}
              disabled={mutating}
              className="h-full"
            />
          </div>
        </div>
      </div>

      <FlagCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSubmit={async (name) => {
          try {
            await addCategory(name)
            toast.success('Category created')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create category')
            throw err
          }
        }}
      />

      <FlagItemDialog
        open={flagDialogOpen}
        onOpenChange={setFlagDialogOpen}
        mode={editingFlag ? 'edit' : 'create'}
        initial={editingFlag}
        categoryName={selectedCategory?.name}
        onCreate={async (labels) => {
          if (!selectedCategory) return
          try {
            const created = await addFlags(selectedCategory.id, labels)
            toast.success(
              created.length > 1
                ? `${created.length} flags created`
                : 'Flag created'
            )
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create flag')
            throw err
          }
        }}
        onUpdate={async (label) => {
          if (!selectedCategory || !editingFlag) return
          try {
            await updateFlag(selectedCategory.id, editingFlag.id, { label })
            toast.success('Flag updated')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update flag')
            throw err
          }
        }}
      />

      <FlagDeleteDialog
        open={!!deletingFlag}
        onOpenChange={(open) => {
          if (!open) setDeletingFlag(null)
        }}
        title={'Delete flag'}
        description={`This will permanently remove “${deletingFlag?.label ?? ''}” from this category.`}
        onConfirm={async () => {
          if (!selectedCategory || !deletingFlag) return
          try {
            await deleteFlag(selectedCategory.id, deletingFlag.id)
            toast.success('Flag deleted')
            setDeletingFlag(null)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete flag')
            throw err
          }
        }}
      />
    </div>
  )
}
