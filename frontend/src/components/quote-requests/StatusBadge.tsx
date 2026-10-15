import { STATUS_LABELS, type QuoteStatus } from '../../constants'

const COLORS: Record<QuoteStatus, string> = {
  new: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_review: 'bg-amber-50 text-amber-800 ring-amber-200',
  quoted: 'bg-violet-50 text-violet-700 ring-violet-200',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
