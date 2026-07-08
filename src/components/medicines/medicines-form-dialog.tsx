'use client'

import { useState } from 'react'
import { BookOpen, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Staff } from '@/types'
import { t } from '@/lib/labels'

export interface ClassFormValues {
  name: string
  grade: string
  section: string
  homeroomStaffId: string
  scheduleSummary: string
}

const emptyForm: ClassFormValues = {
  name: '',
  grade: '',
  section: '',
  homeroomStaffId: '',
  scheduleSummary: '',
}

interface MedicinesFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teachers: Staff[]
  onSubmit: (values: ClassFormValues) => Promise<void>
}

export function MedicinesFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: MedicinesFormDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next) setForm(emptyForm)
    onOpenChange(next)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        scheduleSummary: form.scheduleSummary.trim(),
      })
      setForm(emptyForm)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="clinic-form-dialog max-w-md">
        <DialogHeader>
          <div className="dialog-icon-badge classes-dialog-icon-badge mb-2">
            <BookOpen className="h-5 w-5" />
          </div>
          <DialogTitle>{'Add Medicine'}</DialogTitle>
          <DialogDescription>{'Add a new medicine to the vault.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{'Medicine Name'}</Label>
            <Input
              className="classes-form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={'e.g. Arnica Montana'}
            />
          </div>
          <div>
            <Label>{'Information'}</Label>
            <Input
              className="classes-form-input"
              value={form.scheduleSummary}
              onChange={(e) => setForm({ ...form, scheduleSummary: e.target.value })}
              placeholder={t('medicines.informationPlaceholder')}
            />
          </div>
          <Button
            className="w-full classes-hero-primary"
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim()}
          >
            {submitting ? 'Saving...' : 'Add Medicine'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
