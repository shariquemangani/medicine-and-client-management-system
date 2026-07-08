'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ReportFooterProps {
  className?: string
}

export function ReportFooter({ className }: ReportFooterProps) {
  return (
    <div
      className={cn(
        'rounded-[32px] p-10 bg-white border border-slate-50 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700',
        className
      )}
    >
      <div className="space-y-4">
        <div className="relative inline-block">
          <img
            src="/logo/famLogoDark.svg"
            alt="FAMNGX Logo"
            className="h-12 w-auto"
          />
        </div>

        <div className="space-y-1">
          <p className="text-[13px] font-bold text-slate-400">
            <span className="mx-1 text-slate-500"> FAMNGX —</span> Precision
            Nutrition for everyone
          </p>
          <p className="text-[12px] font-medium text-slate-400">
            © 2025 FAM Nutrigenomics. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <a
          href="mailto:support@famngx.com"
          className="text-[14px] font-black text-[#0f172a] hover:text-orange-500 transition-colors"
        >
          support@famngx.com
        </a>
      </div>
    </div>
  )
}
