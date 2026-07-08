'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared'
import type { AdminUser, UserRole } from '@/types'
import type { SettingsNewUserForm } from '@/types/settings-page'
import { cn } from '@/lib/utils'
import { t } from '@/lib/labels'

interface SettingsUsersPanelProps {
  users: AdminUser[]
  newUser: SettingsNewUserForm
  onNewUserChange: (user: SettingsNewUserForm) => void
  onToggleUser: (user: AdminUser) => Promise<void>
  onCreateUser: () => Promise<void>
}

export function SettingsUsersPanel({
  users,
  newUser,
  onNewUserChange,
  onToggleUser,
  onCreateUser,
}: SettingsUsersPanelProps) {

  return (
    <div className="settings-tabs-panel mt-4 space-y-6">
      <div className="clinic-table-shell overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead className="clinic-table-head">
            <tr>
              <th>{'Name'}</th>
              <th>{'Email'}</th>
              <th>{'Role'}</th>
              <th>{'Status'}</th>
              <th className="text-right">{'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="clinic-table-row">
                <td className="font-medium text-foreground">{user.name}</td>
                <td className="text-muted-foreground">{user.email}</td>
                <td className="capitalize text-muted-foreground">
                  {t(`roles.${user.role}` as 'roles.super_admin' | 'roles.staff')}
                </td>
                <td>
                  <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
                </td>
                <td className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      'clinic-table-action h-8',
                      !user.isActive && 'settings-enable-btn'
                    )}
                    onClick={() => onToggleUser(user)}
                  >
                    {user.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="settings-add-user grid max-w-md gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 dark:bg-muted/10">
        <p className="text-sm font-semibold text-foreground">{'Add Admin User'}</p>
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
          placeholder={'Password'}
          className="settings-form-input"
          value={newUser.password}
          onChange={(e) => onNewUserChange({ ...newUser, password: e.target.value })}
        />
        <Select
          value={newUser.role}
          onValueChange={(v) => onNewUserChange({ ...newUser, role: v as UserRole })}
        >
          <SelectTrigger className="settings-form-input">
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
    </div>
  )
}
