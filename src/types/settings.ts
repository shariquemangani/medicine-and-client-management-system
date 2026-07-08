import type { AdminUser, UserRole } from './auth'

export interface BusinessProfile {
  name: string
  logoUrl: string
  address: string
  phone: string
  email: string
  website?: string
}

export interface AcademicConfig {
  academicYear: string
  currentTerm: string
  terms: string[]
}

export interface AdminUserCreateInput {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface AdminUserUpdateInput {
  name?: string
  email?: string
  role?: UserRole
  isActive?: boolean
}

export interface SettingsData {
  profile: BusinessProfile
  academic: AcademicConfig
  users: AdminUser[]
}

export type { AdminUser }
