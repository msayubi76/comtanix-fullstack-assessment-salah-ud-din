import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getErrorMessage, getFieldErrors } from '../../api/client'
import { updateQuoteStatus, type QuoteRequest } from '../../api/quoteRequests'
import type { User } from '../../api/types'
import { ALLOWED_TRANSITIONS, STATUS_LABELS, type QuoteStatus } from '../../constants'

interface Props {
  quoteRequest: QuoteRequest
  user: User
  onUpdated: (quoteRequest: QuoteRequest) => void
}

export function StatusActions({ quoteRequest, user, onUpdated }: Props) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const mutation = useMutation({
    mutationFn: (status: QuoteStatus) => updateQuoteStatus(quoteRequest.id, status),
    onSuccess: (updated) => {
      setMessage({ type: 'success', text: `Status changed to ${STATUS_LABELS[updated.status]}.` })
      onUpdated(updated)
    },
    onError: (error) => {
      setMessage({ type: 'error', text: getFieldErrors(error).status ?? getErrorMessage(error) })
      // someone else may have changed it in the meantime, reload what the server has
      queryClient.invalidateQueries({ queryKey: ['quote-request', quoteRequest.id] })
      queryClient.invalidateQueries({ queryKey: ['quote-requests'] })
    },
  })

  const canUpdate = user.role === 'admin' || quoteRequest.assignee?.id === user.id
  const nextStatuses = ALLOWED_TRANSITIONS[quoteRequest.status]

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">Status</h3>

      {!canUpdate && (
        <p className="mt-2 text-sm text-slate-500">Only the assigned staff member or an admin can change the status.</p>
      )}

      {canUpdate && nextStatuses.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">This request is closed. No further status changes are possible.</p>
      )}

      {canUpdate && nextStatuses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {nextStatuses.map((status) => (
            <button
              key={status}
              onClick={() => mutation.mutate(status)}
              disabled={mutation.isPending}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending && mutation.variables === status ? 'Saving...' : `Move to ${STATUS_LABELS[status]}`}
            </button>
          ))}
        </div>
      )}

      {message && (
        <p role="status" className={`mt-3 text-sm ${message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
          {message.text}
        </p>
      )}
    </section>
  )
}
