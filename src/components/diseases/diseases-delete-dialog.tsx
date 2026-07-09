'use client'

import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Disease } from '@/types/disease'
import { t } from '@/lib/labels'

interface DiseasesDeleteDialogProps {
  target: Disease | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  loading?: boolean
}

export function DiseasesDeleteDialog({
  target,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: DiseasesDeleteDialogProps) {
  const name = target?.name ?? 'Disease'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clinic-form-dialog max-w-md">
        <DialogHeader>
          <div className="dialog-icon-badge dialog-icon-badge-warning mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>{t('diseases.deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('diseases.deleteDescription', { name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="dialog-btn-outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            className="clinic-delete-confirm-btn"
            disabled={loading}
            onClick={async () => {
              try {
                await onConfirm()
                onOpenChange(false)
              } catch {
                // Keep dialog open when delete fails.
              }
            }}
          >
            {loading ? t('diseases.deleting') : t('diseases.deleteConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
