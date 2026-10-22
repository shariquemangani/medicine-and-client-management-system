'use client'

import { Users, UserCheck, CalendarRange, Shield } from 'lucide-react'
import { BentoGrid, BentoCard } from '@/components/shared'
import { SettingsHero, SettingsTabs } from '@/components/settings'
import { StatCardContent } from '@/components/billing'
import type { BusinessProfile, AcademicConfig } from '@/types'
import { useSettingsPage } from '@/hooks/use-settings-page'

export default function SettingsPage() {
  const {
    profile,
    setProfile,
    academic,
    setAcademic,
    users,
    newUser,
    setNewUser,
    initialLoading,
    refreshing,
    stats,
    reload,
    saveProfile,
    saveAcademic,
    toggleUser,
    createUser,
  } = useSettingsPage()

  return (
    <div className="dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          <SettingsHero
            loading={initialLoading}
            schoolName={profile?.name ?? ''}
            academicYear={academic?.academicYear ?? ''}
            onRefresh={reload}
            refreshing={refreshing}
          />
        </BentoCard>

        <BentoCard colSpan={3} accent="staff" delay={0}>
          <StatCardContent
            title="Total Users"
            badge="Team"
            icon={Users}
            accent="staff"
            value={stats.totalUsers}
            loading={initialLoading}
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="medicines" delay={0}>
          <StatCardContent
            title="Active Users"
            badge="Active"
            icon={UserCheck}
            accent="medicines"
            value={stats.activeUsers}
            loading={initialLoading}
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="prescriptions" delay={0}>
          <StatCardContent
            title="Terms"
            badge="Config"
            icon={CalendarRange}
            accent="prescriptions"
            value={stats.terms}
            loading={initialLoading}
          />
        </BentoCard>
        <BentoCard colSpan={3} accent="fees" delay={0}>
          <StatCardContent
            title="Super Admins"
            badge="Admins"
            icon={Shield}
            accent="fees"
            value={stats.superAdmins}
            loading={initialLoading}
          />
        </BentoCard>

        <BentoCard colSpan={12} delay={300}>
          <SettingsTabs
            loading={initialLoading}
            profile={profile}
            onProfileChange={setProfile as (p: BusinessProfile) => void}
            academic={academic}
            onAcademicChange={setAcademic as (a: AcademicConfig) => void}
            users={users}
            newUser={newUser}
            onNewUserChange={setNewUser}
            onSaveProfile={saveProfile}
            onSaveAcademic={saveAcademic}
            onToggleUser={toggleUser}
            onCreateUser={createUser}
          />
        </BentoCard>
      </BentoGrid>
    </div>
  )
}
