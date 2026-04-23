import type { Series } from '../types'
import { InlineForm } from './InlineForm'

interface Props {
  series: Series[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (name: string) => void
  onDelete: (id: string) => void
}

export function SeriesList({ series, selectedId, onSelect, onAdd, onDelete }: Props) {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 flex flex-col gap-4 p-4">
      <h2 className="font-semibold text-gray-800">Series</h2>
      <ul className="flex flex-col gap-1">
        {series.map(s => (
          <li key={s.id} className="flex items-center group">
            <button
              onClick={() => onSelect(s.id)}
              className={`flex-1 text-left px-2 py-1.5 rounded text-sm transition-colors ${
                selectedId === s.id
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {s.name}
            </button>
            <button
              onClick={() => onDelete(s.id)}
              aria-label={`Delete ${s.name}`}
              className="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs px-1"
            >
              ✕
            </button>
          </li>
        ))}
        {series.length === 0 && (
          <li className="text-sm text-gray-400 italic">No series yet</li>
        )}
      </ul>
      <InlineForm placeholder="New series name…" onSubmit={onAdd} />
    </aside>
  )
}
