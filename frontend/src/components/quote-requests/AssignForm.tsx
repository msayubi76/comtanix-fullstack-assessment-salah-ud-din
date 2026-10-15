import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { getErrorMessage, getFieldErrors } from '../../api/client'
import { assignQuoteRequest, type QuoteRequest } from '../../api/quoteRequests'
import type { User } from '../../api/types'

interface Props {
  quoteRequest: QuoteRequest
  users: User[]
  onUpdated: (quoteRequest: QuoteRequest) => void
}

export function AssignForm({ quoteRequest, users, onUpdated }: Props) {
  const queryClient = useQueryClient()
  const currentId = quoteRequest.assignee?.id ? String(quoteRequest.assignee.id) : ''
  const [selected, setSelected] = useState(currentId)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const mutation = useMutation({
    mutationFn: (userId: number) => assignQuoteRequest(quoteRequest.id, userId),
    onSuccess: (updated) => {
      setMessage({ type: 'success', text: `Assigned to ${updated.assignee?.name}.` })
      onUpdated(updated)
    },
    onError: (error) => {
      setMessage({ type: 'error', text: getFieldErrors(error).assigned_to ?? getErrorMessage(error) })
      queryClient.invalidateQueries({ queryKey: ['quote-request', quoteRequest.id] })
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (selected) {
      mutation.mutate(Number(selected))
    }
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-900">{currentId ? 'Reassign' : 'Assign'}</h3>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          aria-label="Assign to"
          value={selected}
          onChange={(e) => { setSelected(e.target.value); setMessage(null) }}
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="" disabled>Select a team member</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!selected || selected === currentId || mutation.isPending}
          className="rounded-md border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
        >
          {mutation.isPending ? 'Saving...' : 'Assign'}
        </button>
      </form>

      {message && (
        <p role="status" className={`mt-2 text-sm ${message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
          {message.text}
        </p>
      )}
    </section>
  )
}
