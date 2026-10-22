'use client'

import { useEffect, useState } from 'react'
import { Check, Pill, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchMedicinesList } from '@/services/medicine-api'
import type { Medicine } from '@/types'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

interface InventoryMedicinePickerProps {
  value: Medicine | null
  onChange: (medicine: Medicine | null) => void
  invalid?: boolean
  inputId?: string
}

/** Searchable picker backed by the medicine vault (name / common name search). */
export function InventoryMedicinePicker({
  value,
  onChange,
  invalid,
  inputId,
}: InventoryMedicinePickerProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (value) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    const timer = setTimeout(async () => {
      try {
        const res = await fetchMedicinesList({ page: 1, limit: 12, search: search.trim() || undefined })
        if (!cancelled) setResults(res.data)
      } catch (error) {
        if (!cancelled) {
          setResults([])
          setLoadError(error instanceof Error ? error.message : t('inventory.loadFailed'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [search, value])

  if (value) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border bg-muted/20 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{value.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {[value.commonName, value.formType].filter(Boolean).join(' · ') || '—'}
          </p>
          {value.potencies?.length ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t('inventory.medicinePotencies')}: {value.potencies.join(', ')}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="attendance-hero-btn h-8 shrink-0"
          onClick={() => onChange(null)}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {t('inventory.medicineChange')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          id={inputId}
          autoComplete="off"
          aria-invalid={invalid || undefined}
          className={cn('attendance-input pl-9', invalid && 'border-red-500/60')}
          placeholder={t('inventory.medicineSearchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div
        className="max-h-48 overflow-y-auto rounded-xl border bg-background"
        role="listbox"
        aria-label={t('inventory.selectMedicine')}
      >
        {loadError ? (
          <p className="p-3 text-xs text-red-600 dark:text-red-400">{loadError}</p>
        ) : results.length === 0 && !loading ? (
          <div className="p-4 text-center">
            <Pill className="mx-auto h-6 w-6 text-muted-foreground/60" />
            <p className="mt-2 text-xs font-medium text-foreground">{t('inventory.medicineNoResults')}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{t('inventory.medicineNoResultsHint')}</p>
          </div>
        ) : (
          results.map((medicine) => (
            <button
              key={medicine.id}
              type="button"
              role="option"
              aria-selected={false}
              className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left transition-colors last:border-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
              onClick={() => onChange(medicine)}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{medicine.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {[medicine.commonName, medicine.formType].filter(Boolean).join(' · ') || '—'}
                  {medicine.potencies?.length
                    ? ` · ${medicine.potencies.length} ${t('inventory.medicinePotencies').toLowerCase()}`
                    : ''}
                </span>
              </span>
              <Check className="h-4 w-4 shrink-0 opacity-0" aria-hidden />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
