import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getCsrfCookie, setUnauthorizedHandler } from '../api/client'
import type { User } from '../api/types'
import { AuthContext } from './AuthContext'

const ME_KEY = ['me']

async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get('/api/me')
    return data.user
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      return null
    }
    throw error
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [sessionExpired, setSessionExpired] = useState(false)

  const me = useQuery({
    queryKey: ME_KEY,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
    retry: false,
  })

  const clearSession = useCallback(() => {
    queryClient.setQueryData(ME_KEY, null)
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'me' })
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (queryClient.getQueryData(ME_KEY)) {
        setSessionExpired(true)
      }
      clearSession()
    })
  }, [queryClient, clearSession])

  const login = useCallback(async (email: string, password: string) => {
    await getCsrfCookie()
    const { data } = await api.post('/api/login', { email, password })
    setSessionExpired(false)
    queryClient.setQueryData(ME_KEY, data.user)
  }, [queryClient])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/logout')
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(() => ({
    user: me.data ?? null,
    isLoading: me.isPending,
    loadError: me.error,
    sessionExpired,
    login,
    logout,
    reload: () => me.refetch(),
  }), [me, sessionExpired, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
