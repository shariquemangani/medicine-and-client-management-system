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
import type { Medicine } from '@/types'
import { getTranslatedClassName } from '@/lib/patient-display'

type ClassWithCount = Medicine & { patientCount?: number }

interface MedicinesDeleteDialogProps {
  target: ClassWithCount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  loading?: boolean
}

export function MedicinesDeleteDialog({
  target,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: MedicinesDeleteDialogProps) {
  const name = target ? getTranslatedClassName(target.name) : 'Vault'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clinic-form-dialog max-w-md">
        <DialogHeader>
          <div className="dialog-icon-badge dialog-icon-badge-warning mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>{'Delete medicine'}</DialogTitle>
          <DialogDescription>{`This will permanently remove ${name} from the medicine vault. This action cannot be undone.`}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="dialog-btn-outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {'Cancel'}
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
            {loading ? 'Deleting...' : 'Delete medicine'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
