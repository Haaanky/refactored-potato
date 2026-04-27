<script lang="ts">
  import type { AppState, Episode, Season } from '../lib/types'
  import { getTally } from '../lib/store'
  import EventCounter from './EventCounter.svelte'

  let {
    state,
    season,
    episode,
    onIncrement,
    onDecrement,
    onAddEventType,
    onDeleteEventType,
  }: {
    state: AppState
    season: Season
    episode: Episode
    onIncrement: (episodeId: string, eventTypeId: string) => void
    onDecrement: (episodeId: string, eventTypeId: string) => void
    onAddEventType: (name: string) => void
    onDeleteEventType: (id: string) => void
  } = $props()

  const eventTypes = $derived(state.eventTypes.filter(et => et.seriesId === season.seriesId))

  let newEventName = $state('')

  function submitNewEvent(e: SubmitEvent) {
    e.preventDefault()
    const name = newEventName.trim()
    if (!name) return
    onAddEventType(name)
    newEventName = ''
  }
</script>

<div class="p-6 max-w-xl">
  <h3 class="font-semibold text-gray-800 mb-4">
    S{String(season.number).padStart(2, '0')}E{String(episode.number).padStart(2, '0')}
    {#if episode.title} — {episode.title}{/if}
  </h3>

  {#if eventTypes.length === 0}
    <p class="text-sm text-gray-400 italic mb-4">
      Inga händelsetyper ännu. Lägg till en nedan för att börja spåra.
    </p>
  {:else}
    <ul class="mb-4">
      {#each eventTypes as et (et.id)}
        <EventCounter
          eventType={et}
          count={getTally(state, episode.id, et.id)}
          onIncrement={() => onIncrement(episode.id, et.id)}
          onDecrement={() => onDecrement(episode.id, et.id)}
          onDelete={() => onDeleteEventType(et.id)}
        />
      {/each}
    </ul>
  {/if}

  <form onsubmit={submitNewEvent} class="flex gap-2 mt-2">
    <input
      type="text"
      placeholder='Ny händelsetyp, t.ex. "Walter säger sitt namn"'
      bind:value={newEventName}
      class="flex-1 px-3 py-1.5 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
    <button
      type="submit"
      class="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
    >
      Lägg till
    </button>
  </form>
</div>
