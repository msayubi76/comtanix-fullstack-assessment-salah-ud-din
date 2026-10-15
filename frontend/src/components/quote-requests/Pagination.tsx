import type { PaginationMeta } from '../../api/quoteRequests'
import { PER_PAGE_OPTIONS } from '../../constants'

interface Props {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

const buttonClass = 'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

export function Pagination({ meta, onPageChange, onPerPageChange }: Props) {
  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1
  const to = Math.min(meta.current_page * meta.per_page, meta.total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
      <p>
        Showing <span className="font-medium text-slate-900">{from}</span>–<span className="font-medium text-slate-900">{to}</span> of{' '}
        <span className="font-medium text-slate-900">{meta.total}</span>
      </p>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="hidden sm:inline">Per page</span>
          <select
            value={meta.per_page}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5"
          >
            {PER_PAGE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>

        <button className={buttonClass} disabled={meta.current_page <= 1} onClick={() => onPageChange(meta.current_page - 1)}>
          Previous
        </button>
        <span className="whitespace-nowrap">Page {meta.current_page} of {meta.last_page}</span>
        <button className={buttonClass} disabled={meta.current_page >= meta.last_page} onClick={() => onPageChange(meta.current_page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}
