'use client'

import { useEffect, useState } from 'react'
import { Loader2, Minus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { StockAdjustInput, StockItem } from '@/types/stock'
import { getAvailableQuantity } from '@/lib/stock-utils'
import { t } from '@/lib/labels'

interface InventoryAdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: StockItem | null
  onConfirm: (input: StockAdjustInput) => Promise<void>
  loading?: boolean
}

const adjustTypes = [
  { value: 'dispense', labelKey: 'inventory.typeDispense' },
  { value: 'adjustment', labelKey: 'inventory.typeAdjustment' },
  { value: 'return', labelKey: 'inventory.typeReturn' },
  { value: 'expired', labelKey: 'inventory.typeExpired' },
] as const

export function InventoryAdjustDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  loading,
}: InventoryAdjustDialogProps) {
  const [type, setType] = useState<StockAdjustInput['type']>('dispense')
  const [quantity, setQuantity] = useState('')
  const [batchId, setBatchId] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setType('dispense')
    setQuantity('')
    setBatchId('')
    setReference('')
    setNotes('')
  }, [open, item])

  if (!item) return null

  const handleSubmit = async () => {
    const qty = Number(quantity)
    if (!qty || qty <= 0) return
    await onConfirm({
      stockItemId: item.id,
      type,
      quantity: qty,
      batchId: batchId || undefined,
      reference: reference || undefined,
      notes: notes || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clinic-form-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-[hsl(var(--metric-attendance))]" />
            {t('inventory.adjustTitle')}
          </DialogTitle>
          <DialogDescription>
            {item.medicineName} · {getAvailableQuantity(item)} {item.unit} available
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>{t('inventory.fieldMovementType')}</Label>
            <Select value={type} onValueChange={(v) => setType(v as StockAdjustInput['type'])}>
              <SelectTrigger className="attendance-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adjustTypes.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('inventory.fieldQuantity')}</Label>
            <Input
              type="number"
              min={1}
              max={item.totalQuantity}
              className="attendance-input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {item.batches.length > 0 ? (
            <div className="space-y-1.5">
              <Label>{t('inventory.fieldBatch')} ({t('common.optional')})</Label>
              <Select value={batchId || 'auto'} onValueChange={(v) => setBatchId(v === 'auto' ? '' : v)}>
                <SelectTrigger className="attendance-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t('inventory.autoFifo')}</SelectItem>
                  {item.batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batchNumber} ({batch.quantity} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>{t('inventory.fieldReference')}</Label>
            <Input
              className="attendance-input"
              placeholder="RX-0000"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('inventory.fieldNotes')}</Label>
            <Input
              className="attendance-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="attendance-hero-btn" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            className="attendance-hero-primary"
            disabled={loading || !quantity || Number(quantity) <= 0}
            onClick={() => void handleSubmit()}
          >
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {t('inventory.confirmAdjust')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
