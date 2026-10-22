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
import { useAppSelector } from '@/redux'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+\d][\d\s()-]{6,19}$/

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export function useSettingsPage() {
  const currentUserId = useAppSelector((s) => s.auth.user?.id)
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
    if (!profile.name?.trim()) {
      toast.error('Clinic name is required')
      return
    }
    if (profile.email && !EMAIL_RE.test(profile.email.trim())) {
      toast.error('Enter a valid email address')
      return
    }
    if (profile.phone && !PHONE_RE.test(profile.phone.trim())) {
      toast.error('Enter a valid phone number')
      return
    }
    try {
      await updateBusinessProfile(profile)
      toast.success('Profile saved')
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to save profile'))
    }
  }, [profile])

  const saveAcademic = useCallback(async () => {
    if (!academic) return
    try {
      await updateAcademicConfig(academic)
      toast.success('Operations config saved')
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to save operations config'))
    }
  }, [academic])

  const refreshUsers = useCallback(async () => {
    setUsers(await fetchAdminUsers())
  }, [])

  const toggleUser = useCallback(
    async (user: AdminUser) => {
      if (user.isActive && user.id === currentUserId) {
        toast.error('You cannot disable your own account')
        return
      }
      try {
        await updateAdminUser(user.id, { isActive: !user.isActive })
        toast.success(user.isActive ? 'User disabled' : 'User enabled')
        await refreshUsers()
      } catch (error) {
        toast.error(errorMessage(error, 'Failed to update user'))
      }
    },
    [refreshUsers, currentUserId]
  )

  const createUser = useCallback(async () => {
    if (!newUser.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!EMAIL_RE.test(newUser.email.trim())) {
      toast.error('Enter a valid email address')
      return
    }
    if (newUser.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    try {
      await createAdminUser(newUser)
      toast.success('User created')
      setNewUser(defaultSettingsNewUser)
      await refreshUsers()
    } catch (error) {
      toast.error(errorMessage(error, 'Failed to create user'))
    }
  }, [newUser, refreshUsers])

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
