export type PatientSummaryCardIcon =
  | 'users'
  | 'clipboard-list'
  | 'droplet'
  | 'utensils'
  | 'phone'
  | 'zap'

export interface PatientSummaryCard {
  id: string
  title: string
  value: string | number
  icon: PatientSummaryCardIcon
  accent?: string
}
