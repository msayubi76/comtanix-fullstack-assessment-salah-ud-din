import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { getErrorMessage, getFieldErrors } from '../api/client'
import { submitQuoteRequest, type QuoteRequestSubmission } from '../api/quoteRequests'
import { BUDGET_RANGE_LABELS, SERVICE_TYPE_LABELS } from '../constants'

const EMPTY_FORM: QuoteRequestSubmission = {
  client_name: '',
  email: '',
  company: '',
  service_type: '',
  budget_range: '',
  message: '',
  website: '',
}

const inputClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

function FormField({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function RequestQuotePage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  const mutation = useMutation({
    mutationFn: submitQuoteRequest,
    onSuccess: () => setForm(EMPTY_FORM),
    onError: (error) => {
      const errors = getFieldErrors(error)
      setFieldErrors(errors)

      if (error instanceof AxiosError && error.response?.status === 429) {
        setFormError('You have sent too many requests. Please wait a minute and try again.')
      } else if (errors.website) {
        setFormError(errors.website)
      } else if (Object.keys(errors).length === 0) {
        setFormError(getErrorMessage(error))
      }
    },
  })

  function set<K extends keyof QuoteRequestSubmission>(field: K, value: QuoteRequestSubmission[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFieldErrors({})
    setFormError('')
    mutation.mutate(form)
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Request a quote</h1>
          <Link to="/login" className="text-sm text-slate-500 hover:text-slate-800">Staff sign in</Link>
        </div>
        <p className="mt-1 text-sm text-slate-500">Tell us about your project and our team will get back to you.</p>

        {mutation.isSuccess ? (
          <div className="mt-8 rounded-lg border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-900">Thank you, your request has been received.</p>
            <p className="mt-1 text-sm text-slate-500">Your reference number is #{mutation.data.id}. We usually reply within one business day.</p>
            <button
              onClick={() => mutation.reset()}
              className="mt-6 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            {formError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField id="client_name" label="Your name" error={fieldErrors.client_name}>
                <input id="client_name" autoComplete="name" value={form.client_name} onChange={(e) => set('client_name', e.target.value)} className={inputClass} />
              </FormField>

              <FormField id="email" label="Email" error={fieldErrors.email}>
                <input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
              </FormField>

              <FormField id="company" label="Company (optional)" error={fieldErrors.company}>
                <input id="company" autoComplete="organization" value={form.company} onChange={(e) => set('company', e.target.value)} className={inputClass} />
              </FormField>

              <FormField id="service_type" label="Service" error={fieldErrors.service_type}>
                <select id="service_type" value={form.service_type} onChange={(e) => set('service_type', e.target.value as QuoteRequestSubmission['service_type'])} className={inputClass}>
                  <option value="">Select a service</option>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </FormField>

              <FormField id="budget_range" label="Budget" error={fieldErrors.budget_range}>
                <select id="budget_range" value={form.budget_range} onChange={(e) => set('budget_range', e.target.value as QuoteRequestSubmission['budget_range'])} className={inputClass}>
                  <option value="">Select a budget</option>
                  {Object.entries(BUDGET_RANGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </FormField>
            </div>

            <FormField id="message" label="Project details (optional)" error={fieldErrors.message}>
              <textarea id="message" rows={5} maxLength={1000} value={form.message} onChange={(e) => set('message', e.target.value)} className={inputClass} />
            </FormField>

            {/* honeypot: hidden from people, bots fill it in and the API rejects the request */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {mutation.isPending ? 'Sending...' : 'Send request'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
