'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportNoteProps {
  title: string
  subtitle?: string
  content: string
  onAction?: () => void
  actionLabel?: string
  type?: 'warning' | 'info' | 'error' | 'success'
  className?: string
}

export function ReportNote({
  title,
  subtitle,
  content,
  onAction,
  actionLabel = 'Okay',
  type = 'warning',
  className,
}: ReportNoteProps) {
  const styles = {
    warning: {
      bg: 'bg-red-50',
      border: 'border-l-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      titleColor: 'text-red-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-l-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-l-red-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-700',
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-600',
    },
  }[type]

  return (
    <div
      className={cn(
        'rounded-[24px] border-l-4 p-8 flex flex-col gap-6 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105',
            styles.iconBg
          )}
        >
          <AlertCircle className={cn('w-6 h-6', styles.iconColor)} />
        </div>
        <div className="space-y-1">
          <h4
            className={cn(
              'text-[11px] font-black uppercase tracking-[0.1em] mb-0.5',
              styles.titleColor
            )}
          >
            {title}
          </h4>
          {subtitle && (
            <p className="text-[#0f172a] text-[13px] font-bold opacity-80">
              By <span className="text-[#0f172a]">{subtitle}</span>
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[14px] leading-[1.8] font-medium text-slate-600 text-pretty">
          {content}
        </p>
      </div>

      {onAction && (
        <div className="pt-2">
          <Button
            onClick={onAction}
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl px-8 h-10 text-xs font-bold transition-all hover:shadow-lg active:scale-95"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
