'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AdvancedDateSelect } from '@/components/shared/advanced-date-select'
import { format } from 'date-fns'
import { AdvancedPhoneInput } from '@/components/shared/advanced-phone-input'
import { AdvancedAadharInput } from '@/components/shared/advanced-aadhar-input'
import { formatPhoneForDisplay } from '@/lib/phone-utils'
import { sanitizeDigitsInput } from '@/lib/input-sanitize'
import { cn } from '@/lib/utils'

interface DetailFieldProps {
  label: string
  value: string
  isEditing: boolean
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'enrollmentDate' | 'aadhar'
  multiline?: boolean
  className?: string
}

export function DetailField({
  label,
  value,
  isEditing,
  onChange,
  type = 'text',
  multiline = false,
  className,
}: DetailFieldProps) {
  const handleChange = (raw: string) => {
    if (type === 'number') onChange?.(sanitizeDigitsInput(raw))
    else onChange?.(raw)
  }

  return (
    <div className={cn('clinic-detail-info-item rounded-xl border p-3', className)}>
      {label ? (
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      ) : null}
      {isEditing ? (
        multiline ? (
          <Textarea
            className="clinic-form-input mt-1 min-h-[80px] resize-none"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : type === 'enrollmentDate' ? (
          <div className="mt-1">
            <AdvancedDateSelect value={value} onChange={(date) => onChange?.(date)} />
          </div>
        ) : type === 'tel' ? (
          <div className="mt-1">
            <AdvancedPhoneInput value={value} onChange={(next) => onChange?.(next)} />
          </div>
        ) : type === 'aadhar' ? (
          <div className="mt-1">
            <AdvancedAadharInput
              value={value}
              onChange={(next) => onChange?.(next)}
              compact
            />
          </div>
        ) : (
          <Input
            type={type === 'number' ? 'tel' : type}
            inputMode={type === 'number' ? 'numeric' : undefined}
            className="clinic-form-input mt-1 h-8"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
          />
        )
      ) : (
        <p className="mt-1 text-sm font-medium text-foreground">
          {type === 'enrollmentDate' && value
            ? format(new Date(`${value}T12:00:00`), 'MMM d, yyyy')
            : type === 'tel' && value
              ? formatPhoneForDisplay(value)
              : type === 'aadhar' && value
                ? value.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
                : value || '—'}
        </p>
      )}
    </div>
  )
}
