'use client'

import { useEffect, useState } from 'react'
import { Loader2, PackagePlus } from 'lucide-react'
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
import type { StockItem, StockReceiveInput } from '@/types/stock'
import { t } from '@/lib/labels'

interface InventoryReceiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: StockItem[]
  selectedItem: StockItem | null
  onConfirm: (input: StockReceiveInput) => Promise<void>
  loading?: boolean
}

const defaultForm = {
  stockItemId: '',
  quantity: '',
  batchNumber: '',
  potency: '',
  unitCost: '',
  expiryDate: '',
  supplier: '',
  location: '',
  reference: '',
  notes: '',
}

export function InventoryReceiveDialog({
  open,
  onOpenChange,
  items,
  selectedItem,
  onConfirm,
  loading,
}: InventoryReceiveDialogProps) {
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (!open) return
    if (selectedItem) {
      setForm({
        ...defaultForm,
        stockItemId: selectedItem.id,
        potency: selectedItem.potency ?? '',
        supplier: selectedItem.supplier ?? '',
        location: selectedItem.location,
        batchNumber: `${selectedItem.medicineName.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}`,
      })
    } else {
      setForm(defaultForm)
    }
  }, [open, selectedItem])

  const handleSubmit = async () => {
    if (!form.stockItemId || !form.quantity || !form.batchNumber || !form.expiryDate) return
    await onConfirm({
      stockItemId: form.stockItemId,
      quantity: Number(form.quantity),
      batchNumber: form.batchNumber,
      potency: form.potency || undefined,
      unitCost: Number(form.unitCost) || 0,
      expiryDate: form.expiryDate,
      supplier: form.supplier || undefined,
      location: form.location || undefined,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    })
    onOpenChange(false)
  }

  const activeItem = items.find((i) => i.id === form.stockItemId) ?? selectedItem

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clinic-form-dialog max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-[hsl(var(--metric-attendance))]" />
            {t('inventory.receiveTitle')}
          </DialogTitle>
          <DialogDescription>{t('inventory.receiveDesc')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>{t('inventory.colMedicine')}</Label>
            <Select
              value={form.stockItemId}
              onValueChange={(v) => {
                const item = items.find((i) => i.id === v)
                setForm((prev) => ({
                  ...prev,
                  stockItemId: v,
                  potency: item?.potency ?? '',
                  supplier: item?.supplier ?? '',
                  location: item?.location ?? '',
                }))
              }}
            >
              <SelectTrigger className="attendance-input">
                <SelectValue placeholder={t('inventory.selectMedicine')} />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.medicineName} {item.potency ? `(${item.potency})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('inventory.fieldQuantity')}</Label>
              <Input
                type="number"
                min={1}
                className="attendance-input"
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              />
              {activeItem ? (
                <p className="text-[10px] text-muted-foreground">Unit: {activeItem.unit}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>{t('inventory.fieldUnitCost')}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="attendance-input"
                value={form.unitCost}
                onChange={(e) => setForm((p) => ({ ...p, unitCost: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('inventory.fieldBatch')}</Label>
              <Input
                className="attendance-input"
                value={form.batchNumber}
                onChange={(e) => setForm((p) => ({ ...p, batchNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('inventory.fieldExpiry')}</Label>
              <Input
                type="date"
                className="attendance-input"
                value={form.expiryDate}
                onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('inventory.fieldPotency')}</Label>
              <Input
                className="attendance-input"
                value={form.potency}
                onChange={(e) => setForm((p) => ({ ...p, potency: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('inventory.fieldLocation')}</Label>
              <Input
                className="attendance-input"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('inventory.fieldReference')}</Label>
            <Input
              className="attendance-input"
              placeholder="PO-2025-0001"
              value={form.reference}
              onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('inventory.fieldNotes')}</Label>
            <Input
              className="attendance-input"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="attendance-hero-btn" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            className="attendance-hero-primary"
            disabled={loading || !form.stockItemId || !form.quantity || !form.batchNumber || !form.expiryDate}
            onClick={() => void handleSubmit()}
          >
            {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {t('inventory.receiveStock')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
