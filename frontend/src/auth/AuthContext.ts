import { createContext, useContext } from 'react'
import type { User } from '../api/types'

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  loadError: unknown
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  reload: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
