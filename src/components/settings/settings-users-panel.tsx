'use client'

import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DataTable,
  MemberCell,
  Pill,
  SectionCard,
  SectionCardHeader,
  SummaryStrip,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/shared'
import type { AdminUser, UserRole } from '@/types'
import type { SettingsNewUserForm } from '@/types/settings-page'
import { t } from '@/lib/labels'

interface SettingsUsersPanelProps {
  loading?: boolean
  users: AdminUser[]
  newUser: SettingsNewUserForm
  onNewUserChange: (user: SettingsNewUserForm) => void
  onToggleUser: (user: AdminUser) => Promise<void>
  onCreateUser: () => Promise<void>
}

const skel = 'animate-pulse rounded-md bg-muted'

export function SettingsUsersPanel({
  loading,
  users,
  newUser,
  onNewUserChange,
  onToggleUser,
  onCreateUser,
}: SettingsUsersPanelProps) {
  const active = users.filter((u) => u.isActive).length
  const admins = users.filter((u) => u.role === 'super_admin').length

  return (
    <div className="settings-tabs-panel mt-4 space-y-4">
      <SummaryStrip
        icon={<Users className="h-4 w-4" aria-hidden />}
        title={loading ? <span className={`${skel} inline-block h-4 w-24 align-middle`} /> : `${active} active`}
        subtitle={
          loading ? (
            <span className={`${skel} mt-1 inline-block h-3 w-40`} />
          ) : (
            `${users.length} team member${users.length === 1 ? '' : 's'} · ${admins} admin${admins === 1 ? '' : 's'}`
          )
        }
      />

      <SectionCard>
        <SectionCardHeader title="Team members" description="People who can sign in to this clinic." />
        <DataTable>
          <THead>
            <tr>
              <Th>{'Member'}</Th>
              <Th>{'Role'}</Th>
              <Th>{'Status'}</Th>
              <Th className="text-right">{'Actions'}</Th>
            </tr>
          </THead>
          <tbody aria-busy={loading || undefined}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Tr key={i}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className={`${skel} h-8 w-8 rounded-full`} />
                        <div className="space-y-1.5">
                          <div className={`${skel} h-3.5 w-28`} />
                          <div className={`${skel} h-3 w-40`} />
                        </div>
                      </div>
                    </Td>
                    <Td><div className={`${skel} h-5 w-20 rounded-full`} /></Td>
                    <Td><div className={`${skel} h-5 w-16 rounded-full`} /></Td>
                    <Td><div className={`${skel} ml-auto h-8 w-16`} /></Td>
                  </Tr>
                ))
              : users.map((user) => (
                  <Tr key={user.id}>
                    <Td className="min-w-[240px]">
                      <MemberCell name={user.name} secondary={user.email} />
                    </Td>
                    <Td>
                      <Pill>{t(`roles.${user.role}` as 'roles.super_admin' | 'roles.staff')}</Pill>
                    </Td>
                    <Td>
                      <Pill tone={user.isActive ? 'success' : 'muted'}>{user.isActive ? 'Active' : 'Inactive'}</Pill>
                    </Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl text-xs"
                        onClick={() => onToggleUser(user)}
                      >
                        {user.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </Td>
                  </Tr>
                ))}
          </tbody>
        </DataTable>
      </SectionCard>

      <SectionCard className="max-w-xl">
        <SectionCardHeader title="Add Team Member" description="Create a login for staff or another administrator." />
        <div className="grid gap-3 p-5 sm:p-6">
          <Input
            placeholder={'Name'}
            className="settings-form-input"
            value={newUser.name}
            onChange={(e) => onNewUserChange({ ...newUser, name: e.target.value })}
          />
          <Input
            placeholder={'Email'}
            className="settings-form-input"
            value={newUser.email}
            onChange={(e) => onNewUserChange({ ...newUser, email: e.target.value })}
          />
          <Input
            type="password"
            placeholder={'Password (8+ characters)'}
            className="settings-form-input"
            value={newUser.password}
            onChange={(e) => onNewUserChange({ ...newUser, password: e.target.value })}
          />
          <Select
            value={newUser.role}
            onValueChange={(v) => onNewUserChange({ ...newUser, role: v as UserRole })}
          >
            <SelectTrigger className="settings-form-input" aria-label="Role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">{'Super admin'}</SelectItem>
              <SelectItem value="staff">{'Staff'}</SelectItem>
            </SelectContent>
          </Select>
          <Button className="settings-primary-btn w-fit" onClick={() => onCreateUser()}>
            {'Create User'}
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
