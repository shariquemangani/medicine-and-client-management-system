'use client'

import { IndianRupee, Sparkles, Wallet } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { BentoCard } from '@/components/shared'
import { PatientFormSectionHeader } from '@/components/patients/patient-form-section-header'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { clinicFormFieldItemClass } from '@/components/shared/form-field-layout'
import type { PatientRegistrationFormValues } from '@/lib/patient-registration-schema'
import { cn } from '@/lib/utils'

const FEE_PRESETS = [200, 500, 1000, 1500, 2000, 3000] as const

interface PatientFeesSectionProps {
  form: UseFormReturn<PatientRegistrationFormValues>
}

function formatFeeDisplay(value: string): string {
  const num = Number(value)
  if (!value.trim() || Number.isNaN(num)) return '0.00'
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PatientFeesSection({ form }: PatientFeesSectionProps) {
  const feeValue = form.watch('patientFees')

  return (
    <BentoCard colSpan={12} accent="fees" delay={360}>
      <PatientFormSectionHeader
        accent="fees"
        title="Fees from patient"
        subtitle="Consultation and treatment charges for this visit"
        icon={Wallet}
        secondaryIcon={Sparkles}
      />

      <div className="patient-fees-panel relative overflow-hidden rounded-2xl border border-[hsl(var(--metric-fees)/0.28)] bg-[hsl(var(--metric-fees)/0.06)] p-4 sm:p-5">
        <div className="patient-fees-mesh pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[hsl(var(--metric-fees))]">
              Visit billing
            </p>
            <div className="flex items-end gap-2">
              <IndianRupee
                className="mb-1 h-6 w-6 shrink-0 text-[hsl(var(--metric-fees))]"
                aria-hidden
              />
              <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                {formatFeeDisplay(feeValue)}
              </p>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Enter the amount collected from the patient. Quick presets help you bill common
              consultation fees faster.
            </p>
          </div>

          <FormField
            control={form.control}
            name="patientFees"
            render={({ field }) => (
              <FormItem className={cn(clinicFormFieldItemClass, 'space-y-3')}>
                <FormControl>
                  <div className="patient-fees-input-wrap flex h-12 items-center overflow-hidden rounded-xl border border-[hsl(var(--metric-fees)/0.35)] bg-background/90 shadow-sm backdrop-blur-sm">
                    <span className="flex h-full items-center border-r border-[hsl(var(--metric-fees)/0.2)] bg-[hsl(var(--metric-fees)/0.08)] px-3 text-sm font-semibold text-[hsl(var(--metric-fees))]">
                      ₹
                    </span>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="h-full border-0 bg-transparent text-lg font-semibold tabular-nums shadow-none focus-visible:ring-0"
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </div>
                </FormControl>
                <div className="flex flex-wrap gap-2">
                  {FEE_PRESETS.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        'h-8 rounded-full border-[hsl(var(--metric-fees)/0.25)] bg-background/80 px-3 text-xs font-medium tabular-nums transition-colors hover:border-[hsl(var(--metric-fees)/0.5)] hover:bg-[hsl(var(--metric-fees)/0.1)]',
                        feeValue === String(amount) &&
                          'border-[hsl(var(--metric-fees)/0.55)] bg-[hsl(var(--metric-fees)/0.14)] text-foreground'
                      )}
                      onClick={() => form.setValue('patientFees', String(amount), { shouldDirty: true })}
                    >
                      ₹{amount.toLocaleString('en-IN')}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </BentoCard>
  )
}
