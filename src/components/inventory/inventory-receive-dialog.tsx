'use client'

import { useEffect, useMemo, useState } from 'react'
import { PackagePlus, Plus } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StockItem, StockReceiveInput } from '@/types/stock'
import { todayIsoDate } from '@/lib/stock-utils'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'
import { InventoryField, invalidInputClass } from './inventory-field'

interface InventoryReceiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: StockItem[]
  selectedItem: StockItem | null
  onConfirm: (input: StockReceiveInput) => Promise<void>
  /** Opens the "Add stock item" dialog; shown in the empty state. */
  onAddItem?: () => void
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

type FormState = typeof defaultForm
type FieldName = 'stockItemId' | 'quantity' | 'unitCost' | 'batchNumber' | 'expiryDate'

function validate(form: FormState): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {}
  if (!form.stockItemId) errors.stockItemId = t('inventory.errStockItemRequired')

  if (!form.quantity.trim()) errors.quantity = t('inventory.errQtyRequired')
  else if (!/^\d+$/.test(form.quantity.trim()) || Number(form.quantity) <= 0) {
    errors.quantity = t('inventory.errQtyInteger')
  }

  if (form.unitCost.trim() && !(Number(form.unitCost) >= 0)) errors.unitCost = t('inventory.errUnitCost')

  if (!form.batchNumber.trim()) errors.batchNumber = t('inventory.errBatchNumberRequired')

  if (!form.expiryDate) errors.expiryDate = t('inventory.errExpiryRequired')
  else if (form.expiryDate < todayIsoDate()) errors.expiryDate = t('inventory.errExpiryFuture')
  return errors
}

export function InventoryReceiveDialog({
  open,
  onOpenChange,
  items,
  selectedItem,
  onConfirm,
  onAddItem,
  loading,
}: InventoryReceiveDialogProps) {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setTouched({})
    setSubmitted(false)
    if (selectedItem) {
      setForm({
        ...defaultForm,
        stockItemId: selectedItem.id,
        potency: selectedItem.potency ?? '',
        supplier: selectedItem.supplier ?? '',
        location: selectedItem.location,
      })
    } else {
      setForm(defaultForm)
    }
    // Reset only when the dialog opens or a different item is chosen, not on every store refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedItem?.id])

  const errors = useMemo(() => validate(form), [form])
  const showError = (field: FieldName) => (submitted || touched[field] ? errors[field] : undefined)
  const touch = (field: FieldName) => setTouched((prev) => ({ ...prev, [field]: true }))
  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))

  const activeItem = items.find((i) => i.id === form.stockItemId) ?? null
  const qty = /^\d+$/.test(form.quantity.trim()) ? Number(form.quantity) : 0

  const topUpBatch = useMemo(() => {
    if (!activeItem || !form.batchNumber.trim() || !form.expiryDate) return null
    return (
      activeItem.batches.find(
        (b) =>
          b.batchNumber.toLowerCase() === form.batchNumber.trim().toLowerCase() &&
          b.expiryDate === form.expiryDate
      ) ?? null
    )
  }, [activeItem, form.batchNumber, form.expiryDate])

  const handleSubmit = async () => {
    setSubmitted(true)
    if (Object.keys(errors).length > 0) return
    try {
      await onConfirm({
        stockItemId: form.stockItemId,
        quantity: Number(form.quantity),
        batchNumber: form.batchNumber.trim(),
        potency: form.potency.trim() || undefined,
        unitCost: Number(form.unitCost) || 0,
        expiryDate: form.expiryDate,
        supplier: form.supplier.trim() || undefined,
        location: form.location.trim() || undefined,
        reference: form.reference.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      onOpenChange(false)
    } catch {
      // The page toasts the real error message; keep the dialog open so the user can correct it.
    }
  }

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

        {items.length === 0 ? (
          <div className="attendance-record-empty rounded-2xl border p-8 text-center">
            <PackagePlus className="mx-auto h-9 w-9 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-semibold text-foreground">{t('inventory.receiveNoItemsTitle')}</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              {t('inventory.receiveNoItemsHint')}
            </p>
            {onAddItem ? (
              <Button
                size="sm"
                className="attendance-hero-primary mt-4"
                onClick={() => {
                  onOpenChange(false)
                  onAddItem()
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t('inventory.addItem')}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-2">
              <InventoryField
                label={t('inventory.colMedicine')}
                htmlFor="receive-item"
                error={showError('stockItemId')}
              >
                <Select
                  value={form.stockItemId}
                  onValueChange={(v) => {
                    const item = items.find((i) => i.id === v)
                    set({
                      stockItemId: v,
                      potency: item?.potency ?? '',
                      supplier: item?.supplier ?? '',
                      location: item?.location ?? '',
                    })
                    touch('stockItemId')
                  }}
                >
                  <SelectTrigger
                    id="receive-item"
                    className={cn('attendance-input', showError('stockItemId') && invalidInputClass)}
                  >
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
              </InventoryField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InventoryField
                  label={t('inventory.fieldQuantity')}
                  htmlFor="receive-qty"
                  error={showError('quantity')}
                  hint={activeItem ? `${t('inventory.fieldUnit')}: ${activeItem.unit}` : undefined}
                >
                  <Input
                    id="receive-qty"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    className={cn('attendance-input', showError('quantity') && invalidInputClass)}
                    value={form.quantity}
                    onBlur={() => touch('quantity')}
                    onChange={(e) => set({ quantity: e.target.value })}
                  />
                </InventoryField>
                <InventoryField
                  label={t('inventory.fieldUnitCost')}
                  htmlFor="receive-cost"
                  error={showError('unitCost')}
                >
                  <Input
                    id="receive-cost"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    className={cn('attendance-input', showError('unitCost') && invalidInputClass)}
                    value={form.unitCost}
                    onBlur={() => touch('unitCost')}
                    onChange={(e) => set({ unitCost: e.target.value })}
                  />
                </InventoryField>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InventoryField
                  label={t('inventory.fieldBatch')}
                  htmlFor="receive-batch"
                  error={showError('batchNumber')}
                >
                  <Input
                    id="receive-batch"
                    className={cn('attendance-input', showError('batchNumber') && invalidInputClass)}
                    value={form.batchNumber}
                    onBlur={() => touch('batchNumber')}
                    onChange={(e) => set({ batchNumber: e.target.value })}
                  />
                </InventoryField>
                <InventoryField
                  label={t('inventory.fieldExpiry')}
                  htmlFor="receive-expiry"
                  error={showError('expiryDate')}
                >
                  <Input
                    id="receive-expiry"
                    type="date"
                    min={todayIsoDate()}
                    className={cn('attendance-input', showError('expiryDate') && invalidInputClass)}
                    value={form.expiryDate}
                    onBlur={() => touch('expiryDate')}
                    onChange={(e) => set({ expiryDate: e.target.value })}
                  />
                </InventoryField>
              </div>

              <p
                className={cn(
                  'rounded-xl border px-3 py-2 text-[11px]',
                  topUpBatch
                    ? 'border-[hsl(var(--metric-attendance)/0.35)] bg-[hsl(var(--metric-attendance)/0.08)] text-foreground'
                    : 'bg-muted/20 text-muted-foreground'
                )}
              >
                {topUpBatch
                  ? t('inventory.receiveTopUpExisting', {
                      batch: topUpBatch.batchNumber,
                      expiry: topUpBatch.expiryDate,
                      qty: qty || '—',
                      unit: activeItem?.unit ?? '',
                    })
                  : t('inventory.receiveTopUpHint')}
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InventoryField label={t('inventory.fieldPotency')} htmlFor="receive-potency" optional>
                  <Input
                    id="receive-potency"
                    className="attendance-input"
                    value={form.potency}
                    onChange={(e) => set({ potency: e.target.value })}
                  />
                </InventoryField>
                <InventoryField label={t('inventory.fieldLocation')} htmlFor="receive-location" optional>
                  <Input
                    id="receive-location"
                    className="attendance-input"
                    value={form.location}
                    onChange={(e) => set({ location: e.target.value })}
                  />
                </InventoryField>
              </div>

              <InventoryField label={t('inventory.fieldReference')} htmlFor="receive-ref" optional>
                <Input
                  id="receive-ref"
                  className="attendance-input"
                  placeholder="PO-2025-0001"
                  value={form.reference}
                  onChange={(e) => set({ reference: e.target.value })}
                />
              </InventoryField>

              <InventoryField label={t('inventory.fieldNotes')} htmlFor="receive-notes" optional>
                <Input
                  id="receive-notes"
                  className="attendance-input"
                  value={form.notes}
                  onChange={(e) => set({ notes: e.target.value })}
                />
              </InventoryField>

              {activeItem && qty > 0 ? (
                <p className="text-xs font-medium text-foreground">
                  {t('inventory.receiveResult', {
                    balance: activeItem.totalQuantity + qty,
                    unit: activeItem.unit,
                  })}
                </p>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" className="attendance-hero-btn" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                className="attendance-hero-primary"
                disabled={loading}
                onClick={() => void handleSubmit()}
              >
                {t('inventory.receiveStock')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
