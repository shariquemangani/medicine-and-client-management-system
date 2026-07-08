export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

export type PermissionResource =
  | 'dashboard'
  | 'patients'
  | 'medicines'
  | 'inventory'
  | 'prescriptions'
  | 'billing'
  | 'settings'

export interface Permission {
  resource: PermissionResource
  action: PermissionAction
}
