'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

interface ReportDisclaimerProps {
  className?: string
}

export function ReportDisclaimer({ className }: ReportDisclaimerProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] border-l-[6px] border-[#10203C] p-8 flex flex-col gap-6 shadow-sm bg-[#F8FAFC]/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full border border-[#10203C] flex items-center justify-center">
             <Info className="w-3.5 h-3.5 text-[#10203C]" />
        </div>
        <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-[#10203C] mb-0">
          Important Disclaimer
        </h4>
      </div>

      <div className="space-y-4">
        <p className="text-[13px] leading-[1.8] font-medium text-slate-500 text-pretty">
          This Initial Lifestyle Analysis (LSA) report is prepared by FAMNGX
          based on the personal health information, dietary habits, lifestyle
          factors, and preferences you have provided. The recommendations
          contained herein are intended for educational and general wellness
          purposes only and are personalized to support your nutrition and
          wellness journey. This report does not constitute medical advice,
          diagnosis, or treatment. All personal data shared with FAMNGX remains
          strictly confidential and is used exclusively for your wellness
          planning in accordance with our privacy policy. Individual results may
          vary, and we recommend consulting with qualified healthcare
          professionals before making significant changes to your diet,
          especially if you have underlying medical conditions, are pregnant,
          nursing, or taking medications. FAMNGX and its affiliated
          nutritionists shall not be held liable for any adverse effects or
          consequences resulting from the use or misuse of any information
          contained in this report.
        </p>
      </div>
    </div>
  )
}
