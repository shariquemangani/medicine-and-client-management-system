export interface DashboardStats {
  totalPatients: number
  totalStaffs: number
  totalClasses: number
  feesCollectedThisMonth: number
  attendanceRateToday: number
}

export interface EnrollmentTrend {
  month: string
  count: number
}

export type ActivityType =
  | 'patient_added'
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
