<script lang="ts">
  import type { EventType } from '../lib/types'

  let {
    eventType,
    count,
    onIncrement,
    onDecrement,
    onDelete,
  }: {
    eventType: EventType
    count: number
    onIncrement: () => void
    onDecrement: () => void
    onDelete: () => void
  } = $props()
</script>

<li class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 group">
  <span class="flex-1 text-sm text-gray-800">
    {#if eventType.emoji}<span class="mr-1">{eventType.emoji}</span>{/if}
    {eventType.name}
  </span>

  <span class="w-10 text-center font-mono font-semibold text-gray-900 tabular-nums">
    {count}
  </span>

  <button
    onclick={onDecrement}
    disabled={count === 0}
    aria-label="Ångra senaste"
    class="w-7 h-7 rounded border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm leading-none"
  >
    −
  </button>

  <button
    onclick={onIncrement}
    aria-label="Logga händelse"
    class="w-7 h-7 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm leading-none font-semibold"
  >
    +
  </button>

  <button
    onclick={onDelete}
    aria-label="Ta bort {eventType.name}"
    class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs transition-all ml-1"
  >
    ✕
  </button>
</li>
