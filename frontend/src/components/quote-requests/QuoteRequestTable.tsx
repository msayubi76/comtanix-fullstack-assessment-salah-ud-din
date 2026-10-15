import type { ListFilters, QuoteRequest } from '../../api/quoteRequests'
import { BUDGET_RANGE_LABELS, SERVICE_TYPE_LABELS, type SortField } from '../../constants'
import { StatusBadge } from './StatusBadge'

interface Props {
  items: QuoteRequest[]
  sort: SortField
  direction: ListFilters['direction']
  onSort: (field: SortField) => void
  onSelect?: (quoteRequest: QuoteRequest) => void
}

const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function SortHeader({ field, label, sort, direction, onSort }: { field: SortField; label: string } & Pick<Props, 'sort' | 'direction' | 'onSort'>) {
  const active = sort === field

  return (
    <th scope="col" aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="px-4 py-3 text-left">
      <button onClick={() => onSort(field)} className="inline-flex items-center gap-1 font-medium uppercase tracking-wide hover:text-slate-900">
        {label}
        <span className={active ? 'text-indigo-600' : 'text-slate-300'}>{active && direction === 'asc' ? '▲' : '▼'}</span>
      </button>
    </th>
  )
}

export function QuoteRequestTable({ items, sort, direction, onSort, onSelect }: Props) {
  const sortProps = { sort, direction, onSort }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <SortHeader field="client_name" label="Client" {...sortProps} />
            <th scope="col" className="px-4 py-3 text-left font-medium">Service</th>
            <th scope="col" className="px-4 py-3 text-left font-medium">Budget</th>
            <SortHeader field="status" label="Status" {...sortProps} />
            <th scope="col" className="px-4 py-3 text-left font-medium">Assignee</th>
            <SortHeader field="created_at" label="Created" {...sortProps} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} onClick={() => onSelect?.(item)} className={onSelect ? 'cursor-pointer hover:bg-slate-50' : ''}>
              <td className="px-4 py-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect?.(item) }}
                  className="text-left font-medium text-slate-900 hover:text-indigo-700"
                >
                  {item.client_name}
                </button>
                <div className="text-xs text-slate-500">{item.company ?? item.email}</div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{SERVICE_TYPE_LABELS[item.service_type]}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{BUDGET_RANGE_LABELS[item.budget_range]}</td>
              <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {item.assignee?.name ?? <span className="text-slate-400">Unassigned</span>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dateFormat.format(new Date(item.created_at))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
