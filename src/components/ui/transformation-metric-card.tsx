'use client'

import React from 'react'
import { Card } from './card'
import { Badge } from './badge'
import { Input } from './input'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransformationMetricCardProps {
  icon: LucideIcon
  title: string
  beforeValue?: string
  afterValue?: string
  status?: string
  description?: string
  subDescription?: string
  currentValue?: string
  onBeforeChange?: (val: string) => void
  onAfterChange?: (val: string) => void
  onDescriptionChange?: (val: string) => void
  iconColor?: string
  iconBg?: string
  variant?: 'boxed' | 'text-arrow' | 'single'
  className?: string
}

export const TransformationMetricCard: React.FC<
  TransformationMetricCardProps
> = ({
  icon: Icon,
  title,
  beforeValue = '',
  afterValue = '',
  status = '',
  description = '',
  subDescription = '',
  currentValue = '',
  onBeforeChange,
  onAfterChange,
  onDescriptionChange,
  iconColor = 'text-slate-500',
  iconBg = 'bg-slate-50',
  variant = 'boxed',
  className,
}) => {
  return (
    <Card
      className={cn(
        'w-full p-4 rounded-[24px] border-gray-100 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:border-gray-200',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ',
          iconBg
        )}
      >
        <Icon className={cn('w-6 h-6', iconColor)} />
      </div>

      {/* Title */}
      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ">
        {title}
      </h3>

      {/* Main Value Display */}
      <div className="flex items-center justify-center min-h-[56px] mb-2">
        {variant === 'boxed' && (
          <div className="flex items-center gap-3">
            <Input
              value={beforeValue}
              onChange={e => onBeforeChange?.(e.target.value)}
              placeholder="0.0"
              className="w-[72px] h-12 text-center text-[15px] font-medium text-gray-500 bg-white border-gray-200 rounded-[14px] focus:ring-primary/20"
            />
            <span className="text-gray-400 text-sm font-medium">→</span>
            <Input
              value={afterValue}
              onChange={e => onAfterChange?.(e.target.value)}
              placeholder="0.0"
              className="w-[72px] h-12 text-center text-[15px] font-medium text-gray-900 bg-white border-gray-200 rounded-[14px] focus:ring-primary/20"
            />
          </div>
        )}

        {variant === 'text-arrow' && (
          <div className="flex items-center gap-3">
            <span className="text-xl font-medium text-gray-400 tracking-tight">
              {beforeValue}
            </span>
            <span className="text-gray-300 text-lg font-medium">→</span>
            <span className="text-3xl font-black text-[#0f172a] tracking-tight">
              {afterValue}
            </span>
          </div>
        )}

        {variant === 'single' && (
          <span className="text-3xl font-black text-[#0f172a] tracking-tight">
            {afterValue || beforeValue}
          </span>
        )}
      </div>

      {/* Status Badge */}
      {status && (
        <div className="mb-2">
          <Badge
            className={cn(
              'border-none px-4 py-1.5 rounded-full text-[12px] font-bold tracking-wide',
              variant === 'single'
                ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-50'
                : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-50'
            )}
          >
            {status}
          </Badge>
        </div>
      )}

      {/* Bottom Display */}
      <div className="w-full">
        {variant === 'boxed' ? (
          <Input
            value={description}
            onChange={e => onDescriptionChange?.(e.target.value)}
            placeholder="Placeholder text"
            className="w-full h-10 px-4 text-center text-[13px] font-medium text-gray-500 bg-white border-gray-200 rounded-[14px] focus:ring-primary/20"
          />
        ) : (
          <p className="mt-3 text-[13px] font-medium text-gray-500">
            {currentValue || subDescription}
          </p>
        )}
      </div>
    </Card>
  )
}
