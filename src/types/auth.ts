export type UserRole = 'super_admin' | 'staff'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  businessId: string
  isActive: boolean
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  fullName: string
  email: string
  password: string
}
