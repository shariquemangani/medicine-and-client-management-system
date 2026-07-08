'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Patient } from '@/types'
import { getPatientDisplayName } from '@/lib/patient-display'

interface PatientsDeleteDialogProps {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  loading?: boolean
}

export function PatientsDeleteDialog({
  patient,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: PatientsDeleteDialogProps) {
  const fullName = patient ? getPatientDisplayName(patient) : 'this patient'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clinic-form-dialog max-w-md">
        <DialogHeader>
          <div className="dialog-icon-badge dialog-icon-badge-warning mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>Delete Patient</DialogTitle>
          <DialogDescription>
            This will permanently remove {fullName} from the registry. This action cannot be undone.
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
            Cancel
          </Button>
          <Button
            type="button"
            className="clinic-delete-confirm-btn"
            disabled={loading}
            onClick={async () => {
              try {
                await onConfirm()
              } catch {
                // Keep dialog open when delete fails.
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Patient'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
