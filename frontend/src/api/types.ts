export type Role = 'admin' | 'staff'

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface ApiErrorBody {
  status: false
  code: number
  message: string
  errors?: Record<string, string[]>
}
