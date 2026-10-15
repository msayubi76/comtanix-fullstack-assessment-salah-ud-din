import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useEffect, useRef, type ReactNode } from 'react'
import { getErrorMessage } from '../../api/client'
import { getQuoteRequest, type QuoteRequest } from '../../api/quoteRequests'
import type { User } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { BUDGET_RANGE_LABELS, SERVICE_TYPE_LABELS } from '../../constants'
import { Spinner } from '../Spinner'
import { AssignForm } from './AssignForm'
import { AuditTimeline } from './AuditTimeline'
import { StatusActions } from './StatusActions'
import { StatusBadge } from './StatusBadge'

interface Props {
  id: number
  users: User[]
  onClose: () => void
}

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  )
}

export function QuoteRequestDrawer({ id, users, onClose }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const quoteRequest = useQuery({
    queryKey: ['quote-request', id],
    queryFn: () => getQuoteRequest(id),
  })

  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  function handleUpdated(updated: QuoteRequest) {
    queryClient.setQueryData(['quote-request', id], updated)
    queryClient.invalidateQueries({ queryKey: ['quote-requests'] })
    // the audit event is delivered by a queued job, give it a moment before reloading the timeline
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['audit-events', id] }), 1500)
  }

  const notFound = quoteRequest.error instanceof AxiosError && quoteRequest.error.response?.status === 404
  const item = quoteRequest.data

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden="true" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs text-slate-500">Quote request #{id}</p>
            <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">{item?.client_name ?? 'Loading...'}</h2>
          </div>
          <button ref={closeButton} onClick={onClose} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-8 px-6 py-6">
          {quoteRequest.isPending && <Spinner />}

          {quoteRequest.isError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {notFound ? 'This quote request no longer exists.' : getErrorMessage(quoteRequest.error)}
            </div>
          )}

          {item && user && (
            <>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Email"><a href={`mailto:${item.email}`} className="text-indigo-600 hover:underline">{item.email}</a></Field>
                <Field label="Company">{item.company ?? '—'}</Field>
                <Field label="Service">{SERVICE_TYPE_LABELS[item.service_type]}</Field>
                <Field label="Budget">{BUDGET_RANGE_LABELS[item.budget_range]}</Field>
                <Field label="Status"><StatusBadge status={item.status} /></Field>
                <Field label="Assignee">{item.assignee?.name ?? 'Unassigned'}</Field>
                <Field label="Created">{dateTimeFormat.format(new Date(item.created_at))}</Field>
                <Field label="Last updated">{dateTimeFormat.format(new Date(item.updated_at))}</Field>
                <div className="sm:col-span-2">
                  <Field label="Message">
                    <p className="whitespace-pre-wrap text-slate-700">{item.message || 'No message provided.'}</p>
                  </Field>
                </div>
              </dl>

              <StatusActions quoteRequest={item} user={user} onUpdated={handleUpdated} />

              {user.role === 'admin' && <AssignForm quoteRequest={item} users={users} onUpdated={handleUpdated} />}

              <AuditTimeline quoteRequestId={id} users={users} />
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
