import type { BudgetRange, QuoteStatus, ServiceType, SortField } from '../constants'
import { api, getCsrfCookie } from './client'
import type { User } from './types'

export interface QuoteRequest {
  id: number
  client_name: string
  email: string
  company: string | null
  service_type: ServiceType
  budget_range: BudgetRange
  message: string | null
  status: QuoteStatus
  assignee?: User | null
  created_at: string
  updated_at: string
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface ListFilters {
  search: string
  status: QuoteStatus | ''
  assigned_to: string
  service_type: ServiceType | ''
  sort: SortField
  direction: 'asc' | 'desc'
  page: number
  per_page: number
}

export async function listQuoteRequests(filters: ListFilters) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== null),
  )

  const { data } = await api.get('/api/quote-requests', { params })

  return {
    items: data.quote_requests as QuoteRequest[],
    meta: data.meta as PaginationMeta,
  }
}

export async function listUsers() {
  const { data } = await api.get('/api/users')

  return data.users as User[]
}

export interface QuoteRequestSubmission {
  client_name: string
  email: string
  company: string
  service_type: ServiceType | ''
  budget_range: BudgetRange | ''
  message: string
  website: string
}

export async function submitQuoteRequest(submission: QuoteRequestSubmission) {
  await getCsrfCookie()
  const { data } = await api.post('/api/public/quote-requests', submission)

  return data.quote_request as QuoteRequest
}

export async function getQuoteRequest(id: number) {
  const { data } = await api.get(`/api/quote-requests/${id}`)

  return data.quote_request as QuoteRequest
}

export async function updateQuoteStatus(id: number, status: QuoteStatus) {
  const { data } = await api.patch(`/api/quote-requests/${id}/status`, { status })

  return data.quote_request as QuoteRequest
}

export async function assignQuoteRequest(id: number, assignedTo: number) {
  const { data } = await api.patch(`/api/quote-requests/${id}/assign`, { assigned_to: assignedTo })

  return data.quote_request as QuoteRequest
}

export type AuditEventType = 'quote_request.created' | 'quote_request.status_changed' | 'quote_request.assigned'

export interface AuditEvent {
  id: string
  event_id: string
  type: AuditEventType
  actor: User | null
  data: Record<string, string | number | null>
  occurred_at: string
}

export async function listAuditEvents(id: number) {
  const { data } = await api.get(`/api/quote-requests/${id}/audit-events`)

  return data.audit_events as AuditEvent[]
}
