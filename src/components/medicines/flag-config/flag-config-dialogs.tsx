'use client'

import { useEffect, useMemo, useState } from 'react'
import { FolderPlus, Plus, Tags, Trash2 } from 'lucide-react'
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
import type { FlagItem } from '@/types/flag-config'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => Promise<void>
  initialName?: string
  mode?: 'create' | 'edit'
}

export function FlagCategoryDialog({
  open,
  onOpenChange,
  onSubmit,
  initialName = '',
  mode = 'create',
}: CategoryDialogProps) {
  const [name, setName] = useState(initialName)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setSubmitting(false)
    }
  }, [open, initialName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(name.trim())
      onOpenChange(false)
    } catch {
      setSubmitting(false)
    }
  }

  const submitLabel =
    mode === 'edit' ? 'Save' : 'Add Category'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="clinic-form-dialog max-w-md">
        <DialogHeader>
          <div className="dialog-icon-badge mb-2">
            <FolderPlus className="h-5 w-5" />
          </div>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Category' : 'Add Category'}
          </DialogTitle>
          <DialogDescription>{'Create a category to group related clinical flags.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flag-category-name">{'Category name'}</Label>
            <Input
              id="flag-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={'e.g. Quantity Unit'}
              autoFocus
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="dialog-btn-outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {'Cancel'}
            </Button>
            <Button
              type="submit"
              className="flag-config-primary"
              disabled={!name.trim() || submitting}
            >
              {submitting ? (
                <>
                  {'Saving...'}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface FlagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (labels: string[]) => Promise<void>
  onUpdate: (label: string) => Promise<void>
  initial?: FlagItem | null
  mode?: 'create' | 'edit'
  categoryName?: string
}

export function FlagItemDialog({
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  initial = null,
  mode = 'create',
  categoryName,
}: FlagDialogProps) {
  const [labels, setLabels] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setLabels(mode === 'edit' ? [initial?.label ?? ''] : [''])
    setSubmitting(false)
  }, [open, initial, mode])

  const validLabels = useMemo(
    () =>
      Array.from(
        new Set(
          labels
            .map((label) => label.trim())
            .filter((label) => label.length > 0)
        )
      ),
    [labels]
  )

  const canSubmit = mode === 'edit' ? Boolean(labels[0]?.trim()) : validLabels.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      if (mode === 'edit') {
        await onUpdate(labels[0].trim())
      } else {
        await onCreate(validLabels)
      }
      onOpenChange(false)
    } catch {
      setSubmitting(false)
    }
  }

  const submitLabel =
    mode === 'edit'
      ? 'Save'
      : validLabels.length > 1
        ? `Add ${validLabels.length} Flags`
        : 'Add Flag'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="clinic-form-dialog max-w-md">
        <DialogHeader>
          <div className="dialog-icon-badge mb-2">
            <Tags className="h-5 w-5" />
          </div>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Flag' : 'Add Flag'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? categoryName
                ? `Update this flag under ${categoryName}.`
                : 'Update the flag label.'
              : categoryName
                ? `Add one or more flags under ${categoryName}.`
                : 'Add one or more labels. Values are generated automatically.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'edit' ? (
            <div className="space-y-2">
              <Label htmlFor="flag-label">{'Label'}</Label>
              <Input
                id="flag-label"
                value={labels[0] ?? ''}
                onChange={(e) => setLabels([e.target.value])}
                placeholder={'e.g. as needed'}
                autoFocus
                disabled={submitting}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>{'Label'}</Label>
                <span className="text-[11px] text-muted-foreground">
                  {'Add multiple labels at once'}
                </span>
              </div>
              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                {labels.map((label, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={label}
                      onChange={(e) => {
                        const next = [...labels]
                        next[index] = e.target.value
                        setLabels(next)
                      }}
                      placeholder={'e.g. as needed'}
                      autoFocus={index === 0}
                      disabled={submitting}
                    />
                    {labels.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="flag-config-action-delete h-9 w-9 shrink-0"
                        onClick={() =>
                          setLabels((prev) => prev.filter((_, i) => i !== index))
                        }
                        disabled={submitting}
                        aria-label={'Remove label'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="dialog-btn-outline w-full"
                onClick={() => setLabels((prev) => [...prev, ''])}
                disabled={submitting}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {'Add another flag'}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="dialog-btn-outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {'Cancel'}
            </Button>
            <Button
              type="submit"
              className="flag-config-primary"
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <>
                  {'Saving...'}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => Promise<void>
  loading?: boolean
}

export function FlagDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading,
}: DeleteDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const busy = loading || submitting

  useEffect(() => {
    if (!open) setSubmitting(false)
  }, [open])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="clinic-form-dialog max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="dialog-btn-outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {'Cancel'}
          </Button>
          <Button
            type="button"
            className="clinic-delete-confirm-btn"
            disabled={busy}
            onClick={async () => {
              setSubmitting(true)
              try {
                await onConfirm()
                onOpenChange(false)
              } catch {
                setSubmitting(false)
              }
            }}
          >
            {busy ? (
              <>
                {'Deleting...'}
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
