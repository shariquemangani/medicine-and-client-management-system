'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransformationCardProps {
  label: string
  beforeValue: string | number
  afterValue: string | number
  changeText: string
  unit?: string
  showCheckmark?: boolean
  className?: string
}

export const TransformationCard: React.FC<TransformationCardProps> = ({
  label,
  beforeValue,
  afterValue,
  changeText,
  unit = '',
  showCheckmark = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative bg-white border border-gray-100 rounded-[20px] p-6 flex flex-col items-center justify-center gap-4 min-w-[160px] shadow-sm hover:shadow-md transition-shadow duration-300',
        className
      )}
    >
      {showCheckmark && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-[#0f172a] rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
        </div>
      )}

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
        {label}
      </p>

      <div className="flex items-center gap-3">
        <span className="text-xl text-gray-400 line-through decoration-gray-300 font-medium tracking-tight">
          {beforeValue}
          {unit}
        </span>
        <span className="text-gray-400 text-xs">→</span>
        <span className="text-2xl font-black text-[#0f172a] tracking-tight">
          {afterValue}
          {unit}
        </span>
      </div>

      <div className="bg-[#eef2ff] px-4 py-1.5 rounded-full shadow-sm border border-[#e0e7ff]/50">
        <span className="text-[11px] font-black text-[#1e1b4b] uppercase tracking-tighter">
          {changeText}
        </span>
      </div>
    </div>
  )
}
