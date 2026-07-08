import type { PatientBillingSummary } from '@/types'

export interface FeePageStats {
  totalAccounts: number
  totalDue: number
  totalCollected: number
  overdueCount: number
}

export function computeFeePageStats(summaries: PatientBillingSummary[]): FeePageStats {
  let totalDue = 0
  let totalCollected = 0
  let overdueCount = 0

  for (const s of summaries) {
    totalDue += s.balance
    totalCollected += s.totalPaid
    if (s.isOverdue && s.balance > 0) overdueCount++
  }

  return {
    totalAccounts: summaries.length,
    totalDue,
    totalCollected,
    overdueCount,
  }
}
