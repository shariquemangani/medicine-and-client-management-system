'use client'

import { useEffect, useMemo, useState } from 'react'
import { Minus } from 'lucide-react'
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
import type { StockAdjustInput, StockItem } from '@/types/stock'
import {
  getAvailableQuantity,
  getExpiredQuantity,
  getSellableQuantity,
  isExpired,
  sortBatchesByExpiry,
} from '@/lib/stock-utils'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'
import { InventoryField, invalidInputClass } from './inventory-field'

interface InventoryAdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: StockItem | null
  onConfirm: (input: StockAdjustInput) => Promise<void>
  loading?: boolean
}

const adjustTypes = [
  { value: 'dispense', labelKey: 'inventory.typeDispense' },
  { value: 'expired', labelKey: 'inventory.typeExpired' },
  { value: 'return', labelKey: 'inventory.typeReturn' },
  { value: 'adjustment', labelKey: 'inventory.typeAdjustment' },
] as const

type Direction = 'in' | 'out'

const AUTO = 'auto'

export function InventoryAdjustDialog({
  open,
  onOpenChange,
  item,
  onConfirm,
  loading,
}: InventoryAdjustDialogProps) {
  const [type, setType] = useState<StockAdjustInput['type']>('dispense')
  const [direction, setDirection] = useState<Direction>('out')
  const [quantity, setQuantity] = useState('')
  const [batchId, setBatchId] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const batches = useMemo(() => sortBatchesByExpiry(item?.batches ?? []), [item])
  const hasExpired = batches.some((b) => isExpired(b.expiryDate))

  /** Default batch for the chosen movement. Dispensing never auto-picks when expired batches exist. */
  const defaultBatchFor = (nextType: StockAdjustInput['type'], nextDirection: Direction) => {
    const adds = nextType === 'return' || (nextType === 'adjustment' && nextDirection === 'in')
    if (adds) return ''
    if (nextType === 'dispense' && hasExpired) {
      return batches.find((b) => !isExpired(b.expiryDate))?.id ?? ''
    }
    return ''
  }

  useEffect(() => {
    if (!open) return
    setType('dispense')
    setDirection('out')
    setQuantity('')
    setBatchId(
      batches.some((b) => isExpired(b.expiryDate)) ? (batches.find((b) => !isExpired(b.expiryDate))?.id ?? '') : ''
    )
    setReference('')
    setNotes('')
    setSubmitted(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])

  if (!item) return null

  const adds = type === 'return' || (type === 'adjustment' && direction === 'in')
  const selectedBatch = batches.find((b) => b.id === batchId)

  const selectableBatches = batches.filter((b) => {
    if (adds) return true
    if (type === 'dispense') return !isExpired(b.expiryDate)
    if (type === 'expired') return isExpired(b.expiryDate)
    return true
  })

  /** How many units this movement could remove (undefined when adding). */
  let maxQty: number | undefined
  if (!adds) {
    if (selectedBatch) maxQty = selectedBatch.quantity
    else if (type === 'dispense') maxQty = getSellableQuantity(item)
    else if (type === 'expired') maxQty = getExpiredQuantity(item)
    else maxQty = getAvailableQuantity(item)
  }

  const rawQty = quantity.trim()
  const qty = /^\d+$/.test(rawQty) ? Number(rawQty) : 0

  let qtyError: string | undefined
  if (!rawQty) qtyError = t('inventory.errQtyRequired')
  else if (!/^\d+$/.test(rawQty) || qty <= 0) qtyError = t('inventory.errQtyInteger')
  else if (maxQty !== undefined && qty > maxQty) {
    qtyError = selectedBatch
      ? t('inventory.errQtyBatchMax', { max: maxQty, unit: item.unit })
      : t('inventory.errQtyMax', { max: maxQty, unit: item.unit })
  }
  if (!qtyError && maxQty === 0) qtyError = t('inventory.errNoStockAvailable')

  const batchError = adds && !batchId ? t('inventory.errBatchRequired') : undefined
  const noBatchesToAddTo = adds && batches.length === 0

  const showQtyError = submitted || rawQty !== '' ? qtyError : undefined
  const showBatchError = submitted ? batchError : undefined

  const balance = qty > 0 ? item.totalQuantity + (adds ? qty : -qty) : undefined

  const resetBatchFor = (nextType: StockAdjustInput['type'], nextDirection: Direction) => {
    setBatchId(defaultBatchFor(nextType, nextDirection))
  }

  const handleSubmit = async () => {
    setSubmitted(true)
    if (qtyError || batchError) return
    try {
      await onConfirm({
        stockItemId: item.id,
        type,
        quantity: qty,
        direction: type === 'adjustment' ? direction : undefined,
        batchId: batchId || undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onOpenChange(false)
    } catch {
      // The page toasts the real error message; keep the dialog open so the user can correct it.
    }
  }

  const batchHint = adds
    ? t('inventory.batchRequiredHint')
    : type === 'dispense' && hasExpired
      ? t('inventory.batchOptionalHintExpiredSkipped')
      : t('inventory.batchOptionalHint')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clinic-form-dialog max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-[hsl(var(--metric-attendance))]" />
            {t('inventory.adjustTitle')}
          </DialogTitle>
          <DialogDescription>
            {item.medicineName}
            {item.potency ? ` (${item.potency})` : ''} ·{' '}
            {t('inventory.sellableQty', { qty: getSellableQuantity(item), unit: item.unit })}
            {getExpiredQuantity(item) > 0
              ? ` · ${t('inventory.expiredQty', { qty: getExpiredQuantity(item), unit: item.unit })}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <InventoryField label={t('inventory.fieldMovementType')} htmlFor="adjust-type">
            <Select
              value={type}
              onValueChange={(v) => {
                const next = v as StockAdjustInput['type']
                setType(next)
                resetBatchFor(next, direction)
              }}
            >
              <SelectTrigger id="adjust-type" className="attendance-input">
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
          </InventoryField>

          {type === 'adjustment' ? (
            <div role="radiogroup" aria-label={t('inventory.fieldDirection')} className="grid grid-cols-2 gap-2">
              {(['in', 'out'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={direction === value}
                  onClick={() => {
                    setDirection(value)
                    resetBatchFor(type, value)
                  }}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-muted/40',
                    direction === value &&
                      'border-[hsl(var(--metric-attendance))] bg-[hsl(var(--metric-attendance)/0.1)] text-foreground'
                  )}
                >
                  {value === 'in' ? t('inventory.countCorrectionAdd') : t('inventory.countCorrectionRemove')}
                </button>
              ))}
            </div>
          ) : null}

          {noBatchesToAddTo ? (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {t('inventory.noBatches')}. {t('inventory.receiveNoItemsHint')}
            </p>
          ) : (
            <InventoryField
              label={`${t('inventory.fieldBatchSelect')}${adds ? '' : ` (${t('common.optional').toLowerCase()})`}`}
              htmlFor="adjust-batch"
              error={showBatchError}
              hint={batchHint}
            >
              <Select
                value={batchId || AUTO}
                onValueChange={(v) => setBatchId(v === AUTO ? '' : v)}
              >
                <SelectTrigger
                  id="adjust-batch"
                  className={cn('attendance-input', showBatchError && invalidInputClass)}
                >
                  <SelectValue placeholder={t('inventory.fieldBatchSelect')} />
                </SelectTrigger>
                <SelectContent>
                  {!adds && !(type === 'dispense' && hasExpired) ? (
                    <SelectItem value={AUTO}>{t('inventory.autoFifo')}</SelectItem>
                  ) : null}
                  {adds && !batchId ? (
                    <SelectItem value={AUTO} disabled>
                      {t('inventory.fieldBatchSelect')}
                    </SelectItem>
                  ) : null}
                  {selectableBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batchNumber} · {batch.quantity} {item.unit} · {batch.expiryDate}
                      {isExpired(batch.expiryDate) ? ` (${t('inventory.expired')})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InventoryField>
          )}

          <InventoryField
            label={t('inventory.fieldQuantity')}
            htmlFor="adjust-qty"
            error={showQtyError}
            hint={
              maxQty !== undefined
                ? selectedBatch
                  ? t('inventory.availableInBatch', { qty: maxQty, unit: item.unit })
                  : t('inventory.availableQty', { qty: maxQty, unit: item.unit })
                : undefined
            }
          >
            <Input
              id="adjust-qty"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              max={maxQty && maxQty > 0 ? maxQty : undefined}
              className={cn('attendance-input', showQtyError && invalidInputClass)}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </InventoryField>

          {balance !== undefined && !qtyError ? (
            <p className="text-xs font-medium text-foreground" data-testid="adjust-balance">
              {t('inventory.resultingBalance', { balance, unit: item.unit })}
            </p>
          ) : null}

          <InventoryField label={t('inventory.fieldReference')} htmlFor="adjust-ref" optional>
            <Input
              id="adjust-ref"
              className="attendance-input"
              placeholder="RX-0000"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </InventoryField>

          <InventoryField label={t('inventory.fieldNotes')} htmlFor="adjust-notes" optional>
            <Input
              id="adjust-notes"
              className="attendance-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </InventoryField>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="attendance-hero-btn" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            className="attendance-hero-primary"
            disabled={loading || noBatchesToAddTo}
            onClick={() => void handleSubmit()}
          >
            {t('inventory.confirmAdjust')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
