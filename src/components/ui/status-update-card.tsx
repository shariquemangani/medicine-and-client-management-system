'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, ChevronDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type StatusUpdateType = 'Resolved' | 'Improved' | 'Active'

export interface StatusUpdateCardProps {
  /** The name of the item (e.g., Fatigue, Bloating) */
  title: string
  /** The icon to display on the left side */
  icon: React.ReactNode
  /** The background color class for the icon wrapper */
  iconBgClass?: string
  /** The text color class for the icon */
  iconColorClass?: string
  /** Current mode of the card */
  mode: 'view' | 'edit'
  /** Baseline value */
  baseline: string
  /** Current value */
  current: string
  /** Current status */
  status: StatusUpdateType | ''
  /** Called when values change in edit mode */
  onChange?: (data: {
    name: string
    baseline: string
    current: string
    status: StatusUpdateType | ''
  }) => void
  /** Called when the remove (x) button is clicked */
  onRemove?: () => void
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  Resolved: { bg: 'bg-[#e8f4ef]', text: 'text-[#358d71]' },
  Improved: { bg: 'bg-[#eef4ff]', text: 'text-[#3b82f6]' },
  Active: { bg: 'bg-[#fff4eb]', text: 'text-[#f59e0b]' },
  '': { bg: 'bg-slate-100', text: 'text-slate-500' },
}

export function StatusUpdateCard({
  title,
  icon,
  iconBgClass = 'bg-slate-100',
  iconColorClass = 'text-slate-600',
  mode,
  baseline,
  current,
  status,
  onChange,
  onRemove,
}: StatusUpdateCardProps) {
  const normalizedStatus = React.useMemo(() => {
    if (!status) return ''
    const s = status.toLowerCase()
    if (s === 'resolved' || s === 'achieved') return 'Resolved'
    if (s === 'improved' || s === 'stable') return 'Improved'
    if (s === 'active') return 'Active'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }, [status])

  const currentStatusConfig = statusConfig[normalizedStatus] || statusConfig['']

  if (mode === 'edit') {
    return (
      <Card className="relative p-5 bg-slate-50/50 border border-slate-100 rounded-[20px] flex gap-4 w-full h-[120px]">
        {/* Close Button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0 mt-1',
            iconBgClass,
            iconColorClass
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          <Input
            value={title}
            onChange={e =>
              onChange?.({ name: e.target.value, baseline, current, status })
            }
            placeholder="Item Name"
            className="h-7 text-base font-semibold text-slate-800 bg-transparent border-transparent px-1 mb-1 focus-visible:ring-1 shadow-none"
          />

          <div className="flex items-center gap-4 pl-1">
            <div className="flex flex-col gap-1 w-[160px]">
              <label className="text-[11px] font-medium text-slate-900">
                Baseline
              </label>
              <Input
                value={baseline}
                onChange={e =>
                  onChange?.({
                    name: title,
                    baseline: e.target.value,
                    current,
                    status,
                  })
                }
                placeholder="Placeholder text"
                className="h-9 bg-white border-slate-200 text-sm shadow-sm"
              />
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 mt-5 flex-shrink-0" />

            <div className="flex flex-col gap-1 w-[160px]">
              <label className="text-[11px] font-medium text-slate-900">
                Current
              </label>
              <Input
                value={current}
                onChange={e =>
                  onChange?.({
                    name: title,
                    baseline,
                    current: e.target.value,
                    status,
                  })
                }
                placeholder="Placeholder text"
                className="h-9 bg-white border-slate-200 text-sm shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="flex flex-col justify-end pb-1">
          <Select
            value={normalizedStatus}
            onValueChange={val =>
              onChange?.({
                name: title,
                baseline,
                current,
                status: val as StatusUpdateType,
              })
            }
          >
            <SelectTrigger
              className={cn(
                'w-[120px] h-9 border-0 shadow-none font-semibold text-sm rounded-lg',
                currentStatusConfig.bg,
                currentStatusConfig.text
              )}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                value="Resolved"
                className="text-[#358d71] font-medium"
              >
                Resolved
              </SelectItem>
              <SelectItem
                value="Improved"
                className="text-[#3b82f6] font-medium"
              >
                Improved
              </SelectItem>
              <SelectItem value="Active" className="text-[#f59e0b] font-medium">
                Active
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    )
  }

  // View Mode
  return (
    <Card className="p-5 bg-white border border-slate-100 rounded-[20px] flex items-center justify-between w-full h-[90px] hover:border-slate-200 transition-colors shadow-sm">
      <div className="flex items-center gap-5">
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0',
            iconBgClass,
            iconColorClass
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1">
          <h3 className="text-[17px] font-semibold text-slate-800">{title}</h3>
          {(baseline || current) && (
            <p className="text-[13px] text-slate-500 font-medium flex items-center gap-2">
              <span className="text-slate-400">Baseline:</span>{' '}
              <span className="text-slate-700">{baseline || '-'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 mx-0.5" />
              <span className="text-slate-400">Current:</span>{' '}
              <span className="text-slate-700">{current || '-'}</span>
            </p>
          )}
        </div>
      </div>

      {/* Status Badge */}
      {normalizedStatus && (
        <div
          className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-semibold',
            currentStatusConfig.bg,
            currentStatusConfig.text
          )}
        >
          {normalizedStatus}
        </div>
      )}
    </Card>
  )
}
