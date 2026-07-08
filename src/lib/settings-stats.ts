import type { AdminUser, AcademicConfig } from '@/types'
import type { SettingsPageStats } from '@/types/settings-page'

export function computeSettingsPageStats(
  users: AdminUser[],
  academic: AcademicConfig | null
): SettingsPageStats {
  let activeUsers = 0
  let superAdmins = 0

  for (const user of users) {
    if (user.isActive) activeUsers++
    if (user.role === 'super_admin') superAdmins++
  }

  return {
    totalUsers: users.length,
    activeUsers,
    superAdmins,
    terms: academic?.terms.length ?? 0,
  }
}
