import type { UserRole } from './auth'

export interface SettingsNewUserForm {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface SettingsPageStats {
  totalUsers: number
  activeUsers: number
  superAdmins: number
  terms: number
}

export const defaultSettingsNewUser: SettingsNewUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff',
}
