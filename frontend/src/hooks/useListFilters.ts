import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { ListFilters } from '../api/quoteRequests'
import { PER_PAGE_OPTIONS, SERVICE_TYPE_LABELS, SORT_LABELS, STATUS_LABELS } from '../constants'

const DEFAULTS: ListFilters = {
  search: '',
  status: '',
  assigned_to: '',
  service_type: '',
  sort: 'created_at',
  direction: 'desc',
  page: 1,
  per_page: 15,
}

function pick<T extends string>(value: string | null, allowed: readonly string[], fallback: T): T {
  return value && allowed.includes(value) ? (value as T) : fallback
}

export function useListFilters() {
  const [params, setParams] = useSearchParams()

  // anything invalid in the URL falls back to the default instead of breaking the request
  const filters = useMemo<ListFilters>(() => ({
    search: params.get('search') ?? '',
    status: pick(params.get('status'), Object.keys(STATUS_LABELS), ''),
    assigned_to: /^\d+$/.test(params.get('assigned_to') ?? '') ? params.get('assigned_to')! : '',
    service_type: pick(params.get('service_type'), Object.keys(SERVICE_TYPE_LABELS), ''),
    sort: pick(params.get('sort'), Object.keys(SORT_LABELS), DEFAULTS.sort),
    direction: params.get('direction') === 'asc' ? 'asc' : 'desc',
    page: Math.max(1, Number(params.get('page')) || 1),
    per_page: (PER_PAGE_OPTIONS as readonly number[]).includes(Number(params.get('per_page')))
      ? Number(params.get('per_page'))
      : DEFAULTS.per_page,
  }), [params])

  const update = useCallback((changes: Partial<ListFilters>, options: { replace?: boolean } = {}) => {
    setParams((current) => {
      const next = new URLSearchParams(current)

      for (const [key, value] of Object.entries(changes)) {
        if (value === '' || value === DEFAULTS[key as keyof ListFilters]) {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
      }

      if (!('page' in changes)) {
        next.delete('page')
      }

      return next
    }, { replace: options.replace })
  }, [setParams])

  const clear = useCallback(() => setParams({}), [setParams])

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.assigned_to || filters.service_type)

  return { filters, update, clear, hasActiveFilters }
}
