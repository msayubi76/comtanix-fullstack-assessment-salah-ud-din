export const STATUS_LABELS = {
  new: 'New',
  in_review: 'In review',
  quoted: 'Quoted',
  closed: 'Closed',
} as const

export const SERVICE_TYPE_LABELS = {
  web_development: 'Web development',
  mobile_app: 'Mobile app',
  ui_ux_design: 'UI/UX design',
  cloud_devops: 'Cloud & DevOps',
  consulting: 'Consulting',
} as const

export const BUDGET_RANGE_LABELS = {
  under_5k: 'Under $5k',
  '5k_10k': '$5k – $10k',
  '10k_25k': '$10k – $25k',
  '25k_50k': '$25k – $50k',
  over_50k: 'Over $50k',
} as const

export const SORT_LABELS = {
  created_at: 'Created',
  updated_at: 'Updated',
  client_name: 'Client',
  status: 'Status',
} as const

export const PER_PAGE_OPTIONS = [15, 25, 50] as const

export type QuoteStatus = keyof typeof STATUS_LABELS
export type ServiceType = keyof typeof SERVICE_TYPE_LABELS
export type BudgetRange = keyof typeof BUDGET_RANGE_LABELS
export type SortField = keyof typeof SORT_LABELS
