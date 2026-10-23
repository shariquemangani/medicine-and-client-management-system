export interface DashboardStats {
  totalPatients: number
  /** Active team members; null when the viewer is not allowed to list users (staff role). */
  totalStaffs: number | null
  totalClasses: number
  feesCollectedThisMonth: number
}

export interface EnrollmentTrend {
  month: string
  count: number
}

export type ActivityType =
  | 'patient_added'
  | 'patient_updated'
  | 'patient_removed'
  | 'attendance_updated'
  | 'exam_results'
  | 'payment_received'
  | 'staff_added'

export interface RecentActivity {
  id: string
  type: ActivityType
  message: string
  timestamp: string
}

export interface DashboardData {
  stats: DashboardStats
  enrollmentTrend: EnrollmentTrend[]
  recentActivities: RecentActivity[]
}
