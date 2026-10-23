'use client'

import * as React from 'react'
import { LayoutGrid, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  clinicFormButtonClass,
  clinicFormControlClass,
} from '@/components/shared/form-field-layout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MADRASA_BLOCK_SECTIONS, isPresetMadrasaBlock } from '@/data/madrasa-block-sections'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

export interface AdvancedBlockSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

function resolveDisplayLabel(value: string, t: (key: string) => string): string {
  if (!value) return ''
  const preset = MADRASA_BLOCK_SECTIONS.find((block) => block.id === value || block.label === value)
  if (preset) return t(preset.labelKey)
  return value
}

export function AdvancedBlockSelect({
  value,
  onChange,
  className,
  disabled = false,
  placeholder,
}: AdvancedBlockSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [customDraft, setCustomDraft] = React.useState('')
  const [showCustom, setShowCustom] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    const isCustom = Boolean(value) && !isPresetMadrasaBlock(value)
    setShowCustom(isCustom)
    setCustomDraft(isCustom ? value : '')
  }, [open, value])

  const selectPreset = (blockId: string) => {
    onChange(blockId)
    setOpen(false)
  }

  const applyCustom = () => {
    const trimmed = customDraft.trim()
    if (!trimmed) return
    onChange(trimmed)
    setOpen(false)
  }

  const display = resolveDisplayLabel(value, t)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            clinicFormControlClass,
            'justify-start gap-2 px-3 font-medium',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-[hsl(var(--metric-inventory))]" aria-hidden />
          <span className="truncate text-xs sm:text-sm">
            {display || placeholder || 'Select block section'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="space-y-1 border-b border-border px-6 py-5 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--metric-inventory)/0.12)]">
              <LayoutGrid className="h-4 w-4 text-[hsl(var(--metric-inventory))]" aria-hidden />
            </div>
            <div>
              <DialogTitle className="text-base">{'Select block section'}</DialogTitle>
              <DialogDescription className="text-xs">
                {'Choose a preset block or enter a custom section'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MADRASA_BLOCK_SECTIONS.map((block) => {
              const selected = value === block.id || value === block.label
              return (
                <button
                  key={block.id}
                  type="button"
                  className={cn(
                    'clinic-block-chip rounded-2xl border px-3 py-3 text-left transition-all',
                    'border-border/70 bg-muted/20 hover:border-[hsl(var(--metric-inventory)/0.35)] hover:bg-muted/40',
                    selected &&
                      'border-[hsl(var(--metric-inventory))] bg-[hsl(var(--metric-inventory)/0.12)] shadow-sm'
                  )}
                  onClick={() => selectPreset(block.id)}
                >
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {'Block section'}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-foreground">
                    {t(block.labelKey)}
                  </span>
                </button>
              )
            })}
          </div>

          {showCustom ? (
            <div
              className={cn(
                'rounded-2xl border border-dashed border-[hsl(var(--metric-patients)/0.45)] bg-[hsl(var(--metric-patients)/0.06)] p-4 transition-colors'
              )}
            >
              <button
                type="button"
                className="mb-3 flex w-full items-center gap-2 rounded-lg text-left transition-colors hover:text-[hsl(var(--metric-patients-text))]"
                onClick={() => setShowCustom(false)}
              >
                <PenLine className="h-4 w-4 text-[hsl(var(--metric-patients-text))]" aria-hidden />
                <span className="text-sm font-semibold text-foreground">
                  {'Custom block section'}
                </span>
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  placeholder={'e.g. Block D, Wing 2'}
                  className="clinic-form-input h-10 flex-1"
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-10 rounded-xl px-4 text-xs font-semibold sm:shrink-0"
                  onClick={applyCustom}
                  disabled={!customDraft.trim()}
                >
                  {'Use custom'}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={cn(
                'clinic-block-custom-trigger w-full rounded-2xl border border-dashed border-border/80 bg-muted/15 p-4 text-left transition-all',
                'hover:border-[hsl(var(--metric-patients)/0.35)] hover:bg-[hsl(var(--metric-patients)/0.06)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--metric-patients)/0.2)]'
              )}
              onClick={() => setShowCustom(true)}
            >
              <span className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-[hsl(var(--metric-patients-text))]" aria-hidden />
                <span className="text-sm font-semibold text-foreground">
                  {'Custom block section'}
                </span>
              </span>
              <span className="mt-2 block text-xs text-muted-foreground">
                {'Tap to enter a custom block or section name.'}
              </span>
            </button>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(clinicFormButtonClass, 'h-9 rounded-xl px-4 text-xs font-semibold')}
            onClick={() => setOpen(false)}
          >
            {'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
