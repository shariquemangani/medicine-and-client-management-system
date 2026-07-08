'use client'

import React from 'react'
import { Card } from './card'
import { Input } from './input'
import { Scale } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { cn } from '@/lib/utils'

interface WeightChangeCardProps {
  weightChange?: string | number
  unit?: string
  reductionPercentage?: string | number
  progress?: string
  description?: string
  onWeightChange?: (val: string) => void
  onProgressChange?: (val: string) => void
  onDescriptionChange?: (val: string) => void
  className?: string
}

export const WeightChangeCard: React.FC<WeightChangeCardProps> = ({
  weightChange = '-6',
  unit = 'kg',
  reductionPercentage = '8.3',
  progress = '',
  description = '',
  onWeightChange,
  onProgressChange,
  onDescriptionChange,
  className,
}) => {
  return (
    <Card
      className={cn(
        'w-full p-6 rounded-[24px] border-gray-100 bg-[#f1f7f9] flex flex-col gap-6',
        className
      )}
    >
      <div className="flex items-center gap-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-[18px] bg-white border-2 border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
          <Scale className="w-8 h-8 text-slate-400" />
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            WEIGHT CHANGE
          </h3>

          <div className="flex items-center gap-4">
            {/* Large Value Box */}
            <div className="bg-white px-6 py-2 rounded-2xl border border-gray-100 shadow-sm min-w-[100px] flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-500">
                {weightChange}
              </span>
            </div>

            <span className="text-4xl font-black text-[#0f172a]">{unit}</span>

            <div className="flex items-center gap-2 ml-2">
              <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm min-w-[60px] flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">
                  {reductionPercentage}
                </span>
              </div>
              <span className="text-gray-500 font-medium">(% reduction)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 max-w-[80%]">
        <Select value={progress} onValueChange={onProgressChange}>
          <SelectTrigger className="w-[30%] h-12 bg-white border-gray-100 rounded-xl focus:ring-primary/20 text-gray-400 font-medium">
            <SelectValue placeholder="Select Progress" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="on-track">On Track</SelectItem>
            <SelectItem value="steady">Steady</SelectItem>
            <SelectItem value="slow">Slow</SelectItem>
          </SelectContent>
        </Select>

        <Input
          value={description}
          onChange={e => onDescriptionChange?.(e.target.value)}
          placeholder="Description"
          className="h-12 bg-white border-gray-100 rounded-xl focus:ring-primary/20 text-gray-400 font-medium"
        />
      </div>
    </Card>
  )
}
