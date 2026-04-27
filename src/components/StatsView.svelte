<script lang="ts">
  import type { AppState, Series, Season } from '../lib/types'
  import { getSeasonStats } from '../lib/store'

  let {
    state,
    series,
    seasons,
  }: {
    state: AppState
    series: Series
    seasons: Season[]
  } = $props()

  const eventTypes = $derived(state.eventTypes.filter(et => et.seriesId === series.id))
</script>

{#if eventTypes.length === 0}
  <div class="p-6 text-sm text-gray-400 italic">
    Inga händelsetyper spårade ännu.
  </div>
{:else}
  <div class="p-6 overflow-y-auto">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="text-left text-gray-500">
          <th class="pb-2 pr-4 font-medium">Säsong</th>
          {#each eventTypes as et (et.id)}
            <th class="pb-2 pr-4 font-medium">{et.name}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each seasons as season (season.id)}
          {@const stats = getSeasonStats(state, series.id, season.number)}
          <tr class="border-t border-gray-100">
            <td class="py-2 pr-4 text-gray-700">Säsong {season.number}</td>
            {#each eventTypes as et (et.id)}
              <td class="py-2 pr-4 font-mono text-gray-900">{stats[et.id] ?? 0}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-gray-300 font-semibold">
          <td class="py-2 pr-4 text-gray-700">Totalt</td>
          {#each eventTypes as et (et.id)}
            {@const total = seasons.reduce((sum, s) => sum + (getSeasonStats(state, series.id, s.number)[et.id] ?? 0), 0)}
            <td class="py-2 pr-4 font-mono text-indigo-700">{total}</td>
          {/each}
        </tr>
      </tfoot>
    </table>
  </div>
{/if}
