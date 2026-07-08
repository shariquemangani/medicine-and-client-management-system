'use client'

import { Wallet } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PaymentMethod, PatientBillingSummary } from '@/types'

export interface BillingPaymentForm {
  amount: number
  method: PaymentMethod
  date: string
  notes: string
}

interface BillingPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: PatientBillingSummary | null
  form: BillingPaymentForm
  onFormChange: (form: BillingPaymentForm) => void
  onSubmit: () => void
  loading?: boolean
}

export function BillingPaymentDialog({
  open,
  onOpenChange,
  patient,
  form,
  onFormChange,
  onSubmit,
  loading,
}: BillingPaymentDialogProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clinic-form-dialog max-w-md">
        <DialogHeader>
          <div className="dialog-icon-badge fees-dialog-icon-badge mb-2">
            <Wallet className="h-5 w-5" />
          </div>
          <DialogTitle>
            {'Record Payment'} — {patient?.patientName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{'Amount'}</Label>
            <Input
              type="number"
              className="fees-input mt-1.5"
              value={form.amount}
              onChange={(e) => onFormChange({ ...form, amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>{'Method'}</Label>
            <Select
              value={form.method}
              onValueChange={(v) => onFormChange({ ...form, method: v as PaymentMethod })}
            >
              <SelectTrigger className="fees-input mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{'Cash'}</SelectItem>
                <SelectItem value="card">{'Card'}</SelectItem>
                <SelectItem value="bank_transfer">{'Bank Transfer'}</SelectItem>
                <SelectItem value="online">{'Online'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{'Date'}</Label>
            <Input
              type="date"
              className="fees-input mt-1.5"
              value={form.date}
              onChange={(e) => onFormChange({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <Label>{'Notes'}</Label>
            <Input
              className="fees-input mt-1.5"
              value={form.notes}
              onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
            />
          </div>
          <Button
            className="fees-hero-primary w-full"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? 'Recording…' : 'Record Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
