'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PackagePlus, Pencil } from 'lucide-react'
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
import type { Medicine } from '@/types'
import type { StockItem, StockItemInput, StockItemUpdate, StockUnit } from '@/types/stock'
import { STOCK_UNIT_OPTIONS } from '@/lib/stock-utils'
import { t } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { InventoryField, invalidInputClass } from './inventory-field'
import { InventoryMedicinePicker } from './inventory-medicine-picker'

const UNIT_VALUES = STOCK_UNIT_OPTIONS.map((o) => o.value) as [StockUnit, ...StockUnit[]]

function buildSchema(isEdit: boolean) {
  return z.object({
    medicineId: isEdit ? z.string() : z.string().min(1, t('inventory.errMedicineRequired')),
    potency: z.string().trim().max(40, t('inventory.errPotencyLength')),
    unit: z.enum(UNIT_VALUES, { error: t('inventory.errUnitRequired') }),
    reorderLevel: z.string().trim().regex(/^\d+$/, t('inventory.errNonNegativeInteger')),
    reorderQuantity: z.string().trim().regex(/^\d+$/, t('inventory.errNonNegativeInteger')),
    location: z.string().trim().min(1, t('inventory.errLocationRequired')).max(80),
    supplier: z.string().trim().max(120),
  })
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>

const emptyValues: FormValues = {
  medicineId: '',
  potency: '',
  unit: 'bottles',
  reorderLevel: '10',
  reorderQuantity: '20',
  location: '',
  supplier: '',
}

interface InventoryItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this item instead of creating a new one. */
  item?: StockItem | null
  onCreate: (input: StockItemInput) => Promise<void>
  onUpdate: (id: string, patch: StockItemUpdate) => Promise<void>
  loading?: boolean
}

export function InventoryItemFormDialog({
  open,
  onOpenChange,
  item,
  onCreate,
  onUpdate,
  loading,
}: InventoryItemFormDialogProps) {
  const isEdit = Boolean(item)
  const schema = useMemo(() => buildSchema(isEdit), [isEdit])
  const [medicine, setMedicine] = useState<Medicine | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!open) return
    setMedicine(null)
    if (item) {
      reset({
        medicineId: item.medicineId,
        potency: item.potency ?? '',
        unit: item.unit,
        reorderLevel: String(item.reorderLevel),
        reorderQuantity: String(item.reorderQuantity),
        location: item.location,
        supplier: item.supplier ?? '',
      })
    } else {
      reset(emptyValues)
    }
  }, [open, item, reset])

  const potency = watch('potency')
  const potencyOptions = medicine?.potencies ?? []

  const submit = handleSubmit(async (values) => {
    const reorderLevel = Number(values.reorderLevel)
    const reorderQuantity = Number(values.reorderQuantity)
    try {
      if (item) {
        await onUpdate(item.id, {
          unit: values.unit,
          reorderLevel,
          reorderQuantity,
          location: values.location,
          supplier: values.supplier,
        })
      } else {
        if (!medicine) {
          setError('medicineId', { message: t('inventory.errMedicineRequired') })
          return
        }
        await onCreate({
          medicineId: medicine.id,
          medicineName: medicine.name,
          commonName: medicine.commonName,
          formType: medicine.formType,
          potency: values.potency || undefined,
          unit: values.unit,
          reorderLevel,
          reorderQuantity,
          location: values.location,
          supplier: values.supplier || undefined,
        })
      }
      onOpenChange(false)
    } catch (error) {
      // The page already toasts the real message; keep the dialog open and flag the field when we can.
      const message = error instanceof Error ? error.message : ''
      if (/already tracked/i.test(message)) setError('potency', { message })
    }
  })

  const title = isEdit ? t('inventory.editItemTitle') : t('inventory.addItemTitle')
  const Icon = isEdit ? Pencil : PackagePlus

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clinic-form-dialog max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-[hsl(var(--metric-attendance))]" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('inventory.editItemDesc') : t('inventory.addItemDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="grid gap-4 py-2">
          {isEdit && item ? (
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-sm font-semibold text-foreground">{item.medicineName}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {[item.formType, item.potency, item.commonName].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          ) : (
            <>
              <InventoryField
                label={t('inventory.colMedicine')}
                htmlFor="stock-medicine-search"
                error={errors.medicineId?.message}
              >
                <InventoryMedicinePicker
                  inputId="stock-medicine-search"
                  value={medicine}
                  invalid={Boolean(errors.medicineId)}
                  onChange={(next) => {
                    setMedicine(next)
                    setValue('medicineId', next?.id ?? '', { shouldValidate: Boolean(next) })
                    setValue('potency', '')
                  }}
                />
              </InventoryField>

              <InventoryField
                label={t('inventory.fieldPotency')}
                htmlFor="stock-potency"
                optional
                error={errors.potency?.message}
                hint={t('inventory.potencyPick')}
              >
                <Input
                  id="stock-potency"
                  className={cn('attendance-input', errors.potency && invalidInputClass)}
                  placeholder={t('inventory.potencyPlaceholder')}
                  {...register('potency')}
                />
                {potencyOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1" aria-label={t('inventory.medicinePotencies')}>
                    {potencyOptions.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setValue('potency', p, { shouldValidate: true })}
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-muted/50',
                          potency === p &&
                            'border-[hsl(var(--metric-attendance))] bg-[hsl(var(--metric-attendance)/0.12)] text-foreground'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                ) : null}
              </InventoryField>
            </>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InventoryField label={t('inventory.fieldUnit')} htmlFor="stock-unit" error={errors.unit?.message}>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="stock-unit" className="attendance-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STOCK_UNIT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </InventoryField>
            <InventoryField
              label={t('inventory.fieldReorderLevel')}
              htmlFor="stock-reorder-level"
              error={errors.reorderLevel?.message}
            >
              <Input
                id="stock-reorder-level"
                inputMode="numeric"
                className={cn('attendance-input', errors.reorderLevel && invalidInputClass)}
                {...register('reorderLevel')}
              />
            </InventoryField>
            <InventoryField
              label={t('inventory.fieldReorderQuantity')}
              htmlFor="stock-reorder-qty"
              error={errors.reorderQuantity?.message}
            >
              <Input
                id="stock-reorder-qty"
                inputMode="numeric"
                className={cn('attendance-input', errors.reorderQuantity && invalidInputClass)}
                {...register('reorderQuantity')}
              />
            </InventoryField>
          </div>

          <InventoryField
            label={t('inventory.fieldLocation')}
            htmlFor="stock-location"
            error={errors.location?.message}
          >
            <Input
              id="stock-location"
              className={cn('attendance-input', errors.location && invalidInputClass)}
              placeholder="Shelf A1"
              {...register('location')}
            />
          </InventoryField>

          <InventoryField
            label={t('inventory.fieldSupplier')}
            htmlFor="stock-supplier"
            optional
            error={errors.supplier?.message}
          >
            <Input id="stock-supplier" className="attendance-input" {...register('supplier')} />
          </InventoryField>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="attendance-hero-btn"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="attendance-hero-primary" disabled={loading}>
              {isEdit ? t('inventory.saveChanges') : t('inventory.createItem')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
