import React from 'react'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface LabImprovementCardProps {
  isEditing?: boolean
  name?: string
  beforeValue?: string
  afterValue?: string
  unit?: string
  improvementText?: string
  options?: { value: string; label: string; unit?: string }[]

  onNameChange?: (val: string) => void
  onBeforeChange?: (val: string) => void
  onAfterChange?: (val: string) => void
  onImprovementTextChange?: (val: string) => void
  onRemove?: () => void
  onSave?: () => void
  onCancel?: () => void
  saveDisabled?: boolean
}

export const LabImprovementCard = ({
  isEditing,
  name = '',
  beforeValue = '',
  afterValue = '',
  unit = '',
  improvementText = '',
  options = [],
  onNameChange,
  onBeforeChange,
  onAfterChange,
  onImprovementTextChange,
  onRemove,
  onSave,
  onCancel,
  saveDisabled = false,
}: LabImprovementCardProps) => {
  return (
    <div className="relative min-w-[260px] max-w-[280px] bg-slate-50/50 rounded-[16px] border-l-[6px] border-[#0f172a] shadow-sm flex flex-col p-5 group flex-shrink-0">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-opacity z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-4">
          {/* Editing Mode */}
          <div>
            <Select onValueChange={onNameChange} value={name || undefined}>
              <SelectTrigger className="w-full h-8 px-3 text-sm font-medium bg-white border border-gray-200 rounded-lg">
                <SelectValue placeholder="Select Lab" />
              </SelectTrigger>
              <SelectContent>
                {options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="00"
              value={beforeValue}
              min={0}
              onChange={e => onBeforeChange?.(e.target.value)}
              className="w-20 h-8 pr-0 text-center text-sm font-semibold bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
              type="number"
              placeholder="00"
              value={afterValue}
              min={0}
              onChange={e => onAfterChange?.(e.target.value)}
              className="w-20 h-8 pr-0 text-center text-sm font-semibold bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {unit && (
              <span className="text-sm font-bold text-gray-900">{unit}</span>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="e.g. Now in optimal range"
              value={improvementText}
              onChange={e => onImprovementTextChange?.(e.target.value)}
              className="w-full h-8 px-2 text-sm font-semibold text-green-600 placeholder:text-green-600/40 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2 mt-2 w-full">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-7 text-[10px]"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            {onSave && (
              <Button
                size="sm"
                className="flex-1 h-7 text-[10px] bg-primary font-bold"
                disabled={saveDisabled}
                onClick={onSave}
              >
                Save
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between">
          {/* View Mode */}
          <div className="text-[13px] font-medium text-gray-500 mb-3">
            {name}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[20px] font-medium text-gray-400">
              {beforeValue ? beforeValue : 0}
            </span>
            <span className="text-[14px] text-gray-400">→</span>
            <span className="text-[20px] font-black text-gray-900">
              {afterValue ? afterValue : 0}
            </span>
            <span className="text-[13px] font-bold text-gray-900 ml-1">
              {unit}
            </span>
          </div>

          <div className="text-[13px] font-bold text-green-500 mt-auto">
            {improvementText}
          </div>
        </div>
      )}
    </div>
  )
}
