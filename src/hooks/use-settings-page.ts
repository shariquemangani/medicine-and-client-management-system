'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  fetchBusinessProfile,
  updateBusinessProfile,
  fetchAcademicConfig,
  updateAcademicConfig,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
} from '@/services/pharmacy-api'
import { computeSettingsPageStats } from '@/lib/settings-stats'
import type { BusinessProfile, AcademicConfig, AdminUser } from '@/types'
import type { SettingsNewUserForm } from '@/types/settings-page'
import { defaultSettingsNewUser } from '@/types/settings-page'
import { t } from '@/lib/labels'

export function useSettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [academic, setAcademic] = useState<AcademicConfig | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newUser, setNewUser] = useState<SettingsNewUserForm>(defaultSettingsNewUser)

  const load = useCallback(async () => {
    const [p, a, u] = await Promise.all([
      fetchBusinessProfile(),
      fetchAcademicConfig(),
      fetchAdminUsers(),
    ])
    setProfile(p)
    setAcademic(a)
    setUsers(u)
  }, [])

  useEffect(() => {
    load().catch(console.error).finally(() => setInitialLoading(false))
  }, [load])

  const reload = useCallback(async () => {
    setRefreshing(true)
    try {
      await load()
    } catch (error) {
      console.error(error)
    } finally {
      setRefreshing(false)
    }
  }, [load])

  const stats = useMemo(
    () => computeSettingsPageStats(users, academic),
    [users, academic]
  )

  const saveProfile = useCallback(async () => {
    if (!profile) return
    await updateBusinessProfile(profile)
    toast.success('Profile saved')
  }, [profile, t])

  const saveAcademic = useCallback(async () => {
    if (!academic) return
    await updateAcademicConfig(academic)
    toast.success('Operations config saved')
  }, [academic, t])

  const refreshUsers = useCallback(async () => {
    setUsers(await fetchAdminUsers())
  }, [])

  const toggleUser = useCallback(
    async (user: AdminUser) => {
      await updateAdminUser(user.id, { isActive: !user.isActive })
      toast.success(user.isActive ? 'User disabled' : 'User enabled')
      await refreshUsers()
    },
    [refreshUsers, t]
  )

  const createUser = useCallback(async () => {
    await createAdminUser(newUser)
    toast.success('User created')
    setNewUser(defaultSettingsNewUser)
    await refreshUsers()
  }, [newUser, refreshUsers, t])

  return {
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
  }
}
