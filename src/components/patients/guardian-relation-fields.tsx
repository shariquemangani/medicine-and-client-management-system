'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  GUARDIAN_RELATION_OTHER,
  GUARDIAN_RELATIONS,
} from '@/data/guardian-relations'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

function GuardianRelationFieldShell({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('clinic-detail-info-item rounded-xl border p-3', className)}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1.5 text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  )
}

interface GuardianRelationSelectProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function GuardianRelationSelect({ value, onChange, error }: GuardianRelationSelectProps) {

  return (
    <GuardianRelationFieldShell label={'Guardian relation'} error={error}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="clinic-form-input w-full">
          <SelectValue placeholder={'Select relation'} />
        </SelectTrigger>
        <SelectContent>
          {GUARDIAN_RELATIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {t(item.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </GuardianRelationFieldShell>
  )
}

interface GuardianRelationOtherInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function GuardianRelationOtherInput({
  value,
  onChange,
  error,
}: GuardianRelationOtherInputProps) {

  return (
    <GuardianRelationFieldShell label={'Specify relation'} error={error}>
      <Input
        className="clinic-form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'Enter relation'}
      />
    </GuardianRelationFieldShell>
  )
}

interface GuardianRelationFieldsProps {
  relation: string
  relationOther: string
  onRelationChange: (value: string) => void
  onRelationOtherChange: (value: string) => void
  relationError?: string
  relationOtherError?: string
}

export function GuardianRelationFields({
  relation,
  relationOther,
  onRelationChange,
  onRelationOtherChange,
  relationError,
  relationOtherError,
}: GuardianRelationFieldsProps) {
  return (
    <div className="space-y-3">
      <GuardianRelationSelect
        value={relation}
        onChange={onRelationChange}
        error={relationError}
      />
      {relation === GUARDIAN_RELATION_OTHER ? (
        <GuardianRelationOtherInput
          value={relationOther}
          onChange={onRelationOtherChange}
          error={relationOtherError}
        />
      ) : null}
    </div>
  )
}
