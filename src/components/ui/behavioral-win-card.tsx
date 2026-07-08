'use client'

import React from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { Control } from 'react-hook-form'
import { BehavioralWinsFormData } from '@/hooks/use-behavioral-wins-form'
import { Input } from './input'

interface BehavioralWinCardProps {
  control: Control<BehavioralWinsFormData>
  name: `knowledge.${number}` | `lifestyle.${number}` | `nutrition.${number}`
  isAdding?: boolean
  isEditing?: boolean
  onSave: () => void
  onCancel: () => void
  onEdit: () => void
}

export const BehavioralWinCard: React.FC<BehavioralWinCardProps> = ({
  control,
  name,
  isAdding = false,
  isEditing = false,
  onSave,
  onCancel,
  onEdit,
}) => {
  const showEditFields = isAdding || isEditing

  if (!showEditFields) {
    // We need to watch values for view mode
    // Using a simplified approach here for the view mode display
    // In a real use case, we might watch the fields or pass them as props
    return null // This will be handled by the parent mapping for simplicity in view mode
  }

  return (
    <div className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-6 flex items-center justify-between gap-6 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm relative group">
      {/* Inputs in Middle */}
      <div className="flex-1 space-y-3">
        <FormField
          control={control}
          name={`${name}.title` as any}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Textarea
                  placeholder="Placeholder text"
                  rows={1}
                  className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium text-gray-900 resize-none transition-all duration-300 placeholder:text-gray-400"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`${name}.description` as any}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl>
                <Textarea
                  placeholder="Placeholder text"
                  rows={1}
                  className="w-full min-h-[44px] px-4 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium text-gray-900 resize-none transition-all duration-300 placeholder:text-gray-400"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* Cancel Button on Right */}
        <Button
          type="button"
          onClick={onCancel}
          variant="ghost"
          size="icon"
          className="w-10 h-10 text-gray-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </Button>
        {/* Left Status Indicator / Save Button (Matches Checkmark Box) */}
        <button
          type="button"
          onClick={onSave}
          className="w-10 h-10 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Check className="w-5.5 h-5.5 stroke-[3]" />
        </button>
      </div>
    </div>
  )
}
