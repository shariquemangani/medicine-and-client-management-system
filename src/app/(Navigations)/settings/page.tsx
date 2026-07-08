'use client'

import { Users, UserCheck, CalendarRange, Shield } from 'lucide-react'
import { BentoGrid, BentoCard, AnimatedStat } from '@/components/shared'
import {
  SettingsHero,
  SettingsTabs,
  SettingsContentSkeleton,
  SettingsHeroSkeleton,
} from '@/components/settings'
import { PatientsStatSkeleton } from '@/components/patients'
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

  const ready = !initialLoading && profile && academic

  return (
    <div className="dashboard-shell space-y-4">
      <BentoGrid>
        <BentoCard colSpan={12} delay={0} className="!p-0">
          {ready ? (
            <SettingsHero
              schoolName={profile!.name}
              academicYear={academic!.academicYear}
              onRefresh={reload}
              refreshing={refreshing}
            />
          ) : (
            <SettingsHeroSkeleton />
          )}
        </BentoCard>

        {initialLoading ? (
          <PatientsStatSkeleton />
        ) : (
          <>
            <BentoCard colSpan={3} accent="staff" delay={60}>
              <AnimatedStat
                title={'Total Users'}
                value={stats.totalUsers}
                icon={Users}
                accent="staff"
                compact
              />
            </BentoCard>
            <BentoCard colSpan={3} accent="medicines" delay={120}>
              <AnimatedStat
                title={'Active Users'}
                value={stats.activeUsers}
                icon={UserCheck}
                accent="medicines"
                compact
              />
            </BentoCard>
            <BentoCard colSpan={3} accent="prescriptions" delay={180}>
              <AnimatedStat
                title={'Terms'}
                value={stats.terms}
                icon={CalendarRange}
                accent="prescriptions"
                compact
              />
            </BentoCard>
            <BentoCard colSpan={3} accent="fees" delay={240}>
              <AnimatedStat
                title={'Super Admins'}
                value={stats.superAdmins}
                icon={Shield}
                accent="fees"
                compact
              />
            </BentoCard>
          </>
        )}

        <BentoCard colSpan={12} delay={300}>
          {ready ? (
            <SettingsTabs
              profile={profile!}
              onProfileChange={setProfile}
              academic={academic!}
              onAcademicChange={setAcademic}
              users={users}
              newUser={newUser}
              onNewUserChange={setNewUser}
              onSaveProfile={saveProfile}
              onSaveAcademic={saveAcademic}
              onToggleUser={toggleUser}
              onCreateUser={createUser}
            />
          ) : (
            <SettingsContentSkeleton />
          )}
        </BentoCard>
      </BentoGrid>
    </div>
  )
}
