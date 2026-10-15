import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '../api/client'
import { listQuoteRequests, listUsers } from '../api/quoteRequests'
import { Filters } from '../components/quote-requests/Filters'
import { Pagination } from '../components/quote-requests/Pagination'
import { QuoteRequestTable } from '../components/quote-requests/QuoteRequestTable'
import type { SortField } from '../constants'
import { useListFilters } from '../hooks/useListFilters'

function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4" role="status" aria-label="Loading quote requests">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
      ))}
    </div>
  )
}

export function QuoteRequestsPage() {
  const { filters, update, clear, hasActiveFilters } = useListFilters()

  const quoteRequests = useQuery({
    queryKey: ['quote-requests', filters],
    queryFn: () => listQuoteRequests(filters),
    placeholderData: keepPreviousData,
  })

  const users = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    staleTime: 5 * 60 * 1000,
  })

  function handleSort(field: SortField) {
    const direction = filters.sort === field && filters.direction === 'desc' ? 'asc' : 'desc'
    update({ sort: field, direction })
  }

  const data = quoteRequests.data

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Quote requests</h1>
        {quoteRequests.isFetching && data && <span className="text-xs text-slate-400">Updating...</span>}
      </div>

      <Filters
        filters={filters}
        users={users.data ?? []}
        onChange={update}
        onClear={clear}
        hasActiveFilters={hasActiveFilters}
      />

      {quoteRequests.isPending && <TableSkeleton />}

      {quoteRequests.isError && !data && (
        <div className="rounded-lg border border-red-200 bg-white p-6 text-center">
          <p className="text-sm text-red-700">{getErrorMessage(quoteRequests.error)}</p>
          <button
            onClick={() => quoteRequests.refetch()}
            className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-700">No quote requests found</p>
          <p className="mt-1 text-sm text-slate-500">
            {hasActiveFilters ? 'Try changing or clearing the filters.' : 'New requests from the public form will show up here.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clear} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800">Clear filters</button>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className={quoteRequests.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <QuoteRequestTable
            items={data.items}
            sort={filters.sort}
            direction={filters.direction}
            onSort={handleSort}
          />
          <div className="mt-4">
            <Pagination
              meta={data.meta}
              onPageChange={(page) => update({ page })}
              onPerPageChange={(perPage) => update({ per_page: perPage })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
