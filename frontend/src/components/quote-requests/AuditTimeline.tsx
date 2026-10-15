import { useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '../../api/client'
import { listAuditEvents, type AuditEvent } from '../../api/quoteRequests'
import type { User } from '../../api/types'
import { STATUS_LABELS, type QuoteStatus } from '../../constants'
import { Spinner } from '../Spinner'

interface Props {
  quoteRequestId: number
  users: User[]
}

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function describe(event: AuditEvent, users: User[]) {
  const actor = event.actor?.name ?? 'Someone'
  const userName = (id: unknown) => users.find((u) => u.id === id)?.name ?? `user #${id}`
  const statusName = (value: unknown) => STATUS_LABELS[value as QuoteStatus] ?? String(value)

  switch (event.type) {
    case 'quote_request.created':
      return 'Request submitted through the public form'
    case 'quote_request.assigned':
      return event.data.from
        ? `${actor} reassigned it from ${userName(event.data.from)} to ${userName(event.data.to)}`
        : `${actor} assigned it to ${userName(event.data.to)}`
    case 'quote_request.status_changed':
      return `${actor} changed the status from ${statusName(event.data.from)} to ${statusName(event.data.to)}`
    default:
      return event.type
  }
}

export function AuditTimeline({ quoteRequestId, users }: Props) {
  const events = useQuery({
    queryKey: ['audit-events', quoteRequestId],
    queryFn: () => listAuditEvents(quoteRequestId),
    retry: false,
  })

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
        <button
          onClick={() => events.refetch()}
          disabled={events.isFetching}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-400"
        >
          {events.isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {events.isPending && <Spinner label="Loading activity..." />}

      {events.isError && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{getErrorMessage(events.error)}</p>
      )}

      {events.data && events.data.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No activity recorded yet. New changes can take a few seconds to show up.</p>
      )}

      {events.data && events.data.length > 0 && (
        <ol className="mt-4 space-y-4 border-l border-slate-200 pl-5">
          {events.data.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
              <p className="text-sm text-slate-800">{describe(event, users)}</p>
              <time dateTime={event.occurred_at} className="text-xs text-slate-500">
                {dateTimeFormat.format(new Date(event.occurred_at))}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
