'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SettingsUsersPanel } from './settings-users-panel'
import type { BusinessProfile, AcademicConfig, AdminUser } from '@/types'
import type { SettingsNewUserForm } from '@/types/settings-page'
import { t } from '@/lib/labels'

interface SettingsTabsProps {
  loading?: boolean
  profile: BusinessProfile | null
  onProfileChange: (profile: BusinessProfile) => void
  academic: AcademicConfig | null
  onAcademicChange: (academic: AcademicConfig) => void
  users: AdminUser[]
  newUser: SettingsNewUserForm
  onNewUserChange: (user: SettingsNewUserForm) => void
  onSaveProfile: () => Promise<void>
  onSaveAcademic: () => Promise<void>
  onToggleUser: (user: AdminUser) => Promise<void>
  onCreateUser: () => Promise<void>
}

export function SettingsTabs({
  loading,
  profile,
  onProfileChange,
  academic,
  onAcademicChange,
  users,
  newUser,
  onNewUserChange,
  onSaveProfile,
  onSaveAcademic,
  onToggleUser,
  onCreateUser,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const fieldSkeleton = <div className="mt-1.5 h-10 w-full animate-pulse rounded-md bg-muted" />

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="settings-tabs">
      <TabsList className="settings-tabs-list">
        <TabsTrigger value="profile" className="settings-tabs-trigger">
          {'Clinic Profile'}
        </TabsTrigger>
        <TabsTrigger value="academic" className="settings-tabs-trigger">
          {t('settings.tabOperations')}
        </TabsTrigger>
        <TabsTrigger value="users" className="settings-tabs-trigger">
          {'Users'}
        </TabsTrigger>
      </TabsList>

      {activeTab === 'profile' && (
        <TabsContent value="profile" className="settings-tabs-panel mt-4">
          <div className="grid max-w-xl gap-4">
            <div>
              <Label htmlFor="clinic-name">{'Clinic Name'}</Label>
              {loading || !profile ? (
                fieldSkeleton
              ) : (
                <Input
                id="clinic-name"
                className="settings-form-input mt-1.5"
                value={profile.name}
                onChange={(e) => onProfileChange({ ...profile!, name: e.target.value })}
              />
              )}
            </div>
            <div>
              <Label htmlFor="clinic-address">{'Address'}</Label>
              {loading || !profile ? (
                fieldSkeleton
              ) : (
                <Input
                id="clinic-address"
                className="settings-form-input mt-1.5"
                value={profile.address}
                onChange={(e) => onProfileChange({ ...profile!, address: e.target.value })}
              />
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="clinic-phone">{'Phone'}</Label>
                {loading || !profile ? (
                  fieldSkeleton
                ) : (
                  <Input
                  id="clinic-phone"
                  className="settings-form-input mt-1.5"
                  value={profile.phone}
                  onChange={(e) => onProfileChange({ ...profile!, phone: e.target.value })}
                />
                )}
              </div>
              <div>
                <Label htmlFor="clinic-email">{'Email'}</Label>
                {loading || !profile ? (
                  fieldSkeleton
                ) : (
                  <Input
                  id="clinic-email"
                  className="settings-form-input mt-1.5"
                  value={profile.email}
                  onChange={(e) => onProfileChange({ ...profile!, email: e.target.value })}
                />
                )}
              </div>
            </div>
            <Button className="settings-primary-btn w-fit" onClick={onSaveProfile}
              disabled={loading || !profile}>
              {'Save Profile'}
            </Button>
          </div>
        </TabsContent>
      )}

      {activeTab === 'academic' && (
        <TabsContent value="academic" className="settings-tabs-panel mt-4">
          <div className="grid max-w-xl gap-4">
            <div>
              <Label htmlFor="academic-year">{'Operations Year'}</Label>
              {loading || !academic ? (
                fieldSkeleton
              ) : (
                <Input
                id="academic-year"
                className="settings-form-input mt-1.5"
                value={academic.academicYear}
                onChange={(e) => onAcademicChange({ ...academic!, academicYear: e.target.value })}
              />
              )}
            </div>
            <div>
              <Label>{'Current Term'}</Label>
              {loading || !academic ? (
                fieldSkeleton
              ) : (
                <Select
                  value={academic.currentTerm}
                  onValueChange={(v) => onAcademicChange({ ...academic!, currentTerm: v })}
                >
                  <SelectTrigger className="settings-form-input mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {academic.terms.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button className="settings-primary-btn w-fit" onClick={onSaveAcademic}
              disabled={loading || !academic}>
              {t('settings.saveOperations')}
            </Button>
          </div>
        </TabsContent>
      )}

      {activeTab === 'users' && (
        <TabsContent value="users">
          <SettingsUsersPanel
            loading={loading}
            users={users}
            newUser={newUser}
            onNewUserChange={onNewUserChange}
            onToggleUser={onToggleUser}
            onCreateUser={onCreateUser}
          />
        </TabsContent>
      )}
    </Tabs>
  )
}
