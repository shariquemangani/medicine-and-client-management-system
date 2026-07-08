export type StaffStatus = 'active' | 'inactive' | 'archived'

export interface Staff {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  email: string
  phone: string
  department: string
  subjects: string[]
  joiningDate: string
  status: StaffStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export type StaffCreateInput = Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>
export type StaffUpdateInput = Partial<StaffCreateInput>
