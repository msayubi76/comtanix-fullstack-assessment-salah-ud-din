import type { BudgetRange, QuoteStatus, ServiceType, SortField } from '../constants'
import { api } from './client'
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
