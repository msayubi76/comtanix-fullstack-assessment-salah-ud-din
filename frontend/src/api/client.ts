import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorBody } from './types'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})

let onUnauthorized: () => void = () => {}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export function getCsrfCookie() {
  return api.get('/sanctum/csrf-cookie')
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined

    // CSRF cookie expired: get a fresh one and retry the request once
    if (error.response?.status === 419 && config && !config._retried) {
      config._retried = true
      await getCsrfCookie()
      return api(config)
    }

    if (error.response?.status === 401) {
      onUnauthorized()
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'Cannot reach the server. Please check your connection.'
    }
    return error.response.data?.message ?? fallback
  }
  return fallback
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof AxiosError && error.response?.status === 422) {
    const errors = (error.response.data as ApiErrorBody).errors ?? {}
    return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]))
  }
  return {}
}
