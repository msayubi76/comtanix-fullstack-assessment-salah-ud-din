import { useState } from 'react'
import type { ListFilters } from '../../api/quoteRequests'
import type { User } from '../../api/types'
import { SERVICE_TYPE_LABELS, STATUS_LABELS } from '../../constants'
import { useDebouncedCallback } from '../../hooks/useDebounce'

interface Props {
  filters: ListFilters
  users: User[]
  onChange: (changes: Partial<ListFilters>, options?: { replace?: boolean }) => void
  onClear: () => void
  hasActiveFilters: boolean
}

const selectClass = 'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

export function Filters({ filters, users, onChange, onClear, hasActiveFilters }: Props) {
  const [search, setSearch] = useState(filters.search)
  const [urlSearch, setUrlSearch] = useState(filters.search)
  const debouncedSearch = useDebouncedCallback((value: string) => onChange({ search: value.trim() }, { replace: true }), 400)

  // keep the input in sync when the URL changes from outside (clear button, back button)
  if (filters.search !== urlSearch) {
    setUrlSearch(filters.search)
    if (filters.search !== search.trim()) {
      setSearch(filters.search)
    }
  }

  function handleSearch(value: string) {
    setSearch(value)
    debouncedSearch.run(value)
  }

  function handleClear() {
    debouncedSearch.cancel()
    onClear()
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <input
        type="search"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search client, email or company"
        aria-label="Search quote requests"
        className={`${selectClass} lg:w-80`}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex">
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as ListFilters['status'] })}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          aria-label="Filter by assignee"
          value={filters.assigned_to}
          onChange={(e) => onChange({ assigned_to: e.target.value })}
          className={selectClass}
        >
          <option value="">All assignees</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>

        <select
          aria-label="Filter by service type"
          value={filters.service_type}
          onChange={(e) => onChange({ service_type: e.target.value as ListFilters['service_type'] })}
          className={selectClass}
        >
          <option value="">All services</option>
          {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button onClick={handleClear} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 lg:ml-auto">
          Clear filters
        </button>
      )}
    </div>
  )
}
