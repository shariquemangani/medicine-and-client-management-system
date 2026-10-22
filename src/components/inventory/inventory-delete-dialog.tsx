'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { StockItem } from '@/types/stock'
import { t } from '@/lib/labels'

interface InventoryDeleteDialogProps {
  item: StockItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (item: StockItem) => Promise<void>
  loading?: boolean
}

export function InventoryDeleteDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: InventoryDeleteDialogProps) {
  if (!item) return null
  const blocked = item.totalQuantity > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('inventory.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {blocked
              ? t('inventory.deleteBlocked')
              : t('inventory.deleteDesc', {
                  name: `${item.medicineName}${item.potency ? ` (${item.potency})` : ''}`,
                })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={blocked || loading}
            onClick={async () => {
              try {
                await onConfirm(item)
                onOpenChange(false)
              } catch {
                // The page toasts the real error message.
              }
            }}
          >
            {t('inventory.deleteConfirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
