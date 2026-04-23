import type { EventType } from '../types'

interface Props {
  eventType: EventType
  count: number
  onIncrement: () => void
  onDecrement: () => void
  onDelete: () => void
}

export function TallyRow({ eventType, count, onIncrement, onDecrement, onDelete }: Props) {
  return (
    <li className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 group">
      <span className="flex-1 text-sm text-gray-700">{eventType.name}</span>
      <span className="w-8 text-center font-mono font-semibold text-gray-900">{count}</span>
      <div className="flex gap-1">
        <button
          onClick={onDecrement}
          disabled={count === 0}
          aria-label="Decrement"
          className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold transition-colors"
        >
          −
        </button>
        <button
          onClick={onIncrement}
          aria-label="Increment"
          className="w-7 h-7 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
        >
          +
        </button>
      </div>
      <button
        onClick={onDelete}
        aria-label={`Delete event type ${eventType.name}`}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-xs"
      >
        ✕
      </button>
    </li>
  )
}
