<script lang="ts">
  import { onDestroy } from 'svelte'
  import { isSupabaseConfigured } from '../lib/supabase'
  import { mockSession, getMockAppState } from '../lib/mockData'
  import type { AppState, RoomSession, Series, Season } from '../lib/types'
  import {
    loadRoomData,
    createSeries,
    deleteSeries,
    createEpisode,
    createEventType,
    deleteEventType,
    logEvent,
    undoLastEvent,
  } from '../lib/roomStore'
  import { getSeasons, getEpisodesForSeason, patchIncrement, patchDecrement } from '../lib/store'
  import { subscribeToEvents, applyEventPayload } from '../lib/realtime'
  import RoomGate from './RoomGate.svelte'
  import EpisodeView from './EpisodeView.svelte'
  import StatsView from './StatsView.svelte'

  let session = $state<RoomSession | null>(isSupabaseConfigured ? null : mockSession)
  let appState = $state<AppState>(isSupabaseConfigured ? { series: [], episodes: [], eventTypes: [], tallies: [] } : getMockAppState())
  let loading = $state(false)
  let realtimeStatus = $state<string>('CONNECTING')

  const nav = $state({
    selectedSeriesId: isSupabaseConfigured ? null as string | null : 'demo-s1',
    selectedEpisodeId: null as string | null,
    openSeasonNumber: null as number | null,
    activeTab: 'track' as 'track' | 'stats',
    pendingSeasonNumbers: [] as number[],
  })

  let unsub: (() => void) | null = null

  async function onJoined(s: RoomSession) {
    session = s
    loading = true
    appState = await loadRoomData(s.room.id)
    loading = false
    if (appState.series.length > 0) nav.selectedSeriesId = appState.series[0].id

    unsub = subscribeToEvents(
      s.room.id,
      payload => { appState = { ...appState, tallies: applyEventPayload(appState.tallies, payload) } },
      status => { realtimeStatus = status },
    )
  }

  onDestroy(() => unsub?.())

  // ── Derived ─────────────────────────────────────────────────────────────────

  const selectedSeries = $derived(
    appState.series.find(s => s.id === nav.selectedSeriesId) ?? null,
  )

  function allSeasons(series: Series): Season[] {
    const real = getSeasons(appState, series.id).map(s => s.number)
    const nums = [...new Set([...real, ...nav.pendingSeasonNumbers])].sort((a, b) => a - b)
    return nums.map(num => ({ id: `${series.id}-s${num}`, seriesId: series.id, number: num }))
  }

  // ── Event delegation for nav ──────────────────────────────────────────────

  function handleNavClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    const epBtn = target.closest('button[data-epid]') as HTMLElement | null
    const seasonBtn = target.closest('button[data-season]') as HTMLElement | null
    console.log('NAV', epBtn?.dataset['epid'], seasonBtn?.dataset['season'])
    if (epBtn?.dataset['epid']) {
      nav.selectedEpisodeId = epBtn.dataset['epid'] ?? null
    } else if (seasonBtn?.dataset['season']) {
      const num = Number(seasonBtn.dataset['season'])
      nav.openSeasonNumber = nav.openSeasonNumber === num ? null : num
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleAddSeries(e: SubmitEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const input = form.elements.namedItem('name') as HTMLInputElement
    const name = input.value.trim()
    if (!name || !session) return
    const s = await createSeries(session.room.id, name)
    if (s) {
      appState = { ...appState, series: [...appState.series, s] }
      nav.selectedSeriesId = s.id
      input.value = ''
    }
  }

  async function handleDeleteSeries(id: string) {
    await deleteSeries(id)
    appState = {
      ...appState,
      series: appState.series.filter(s => s.id !== id),
      episodes: appState.episodes.filter(e => e.seriesId !== id),
      eventTypes: appState.eventTypes.filter(et => et.seriesId !== id),
    }
    if (nav.selectedSeriesId === id) {
      nav.selectedSeriesId = appState.series[0]?.id ?? null
      nav.selectedEpisodeId = null
      nav.openSeasonNumber = null
    }
  }

  function handleAddSeason(series: Series) {
    const nums = allSeasons(series).map(s => s.number)
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    nav.pendingSeasonNumbers = [...nav.pendingSeasonNumbers, next]
    nav.openSeasonNumber = next
  }

  async function handleAddEpisode(seriesId: string, season: number, title: string) {
    const existing = getEpisodesForSeason(appState, seriesId, season)
    const num = existing.length > 0 ? Math.max(...existing.map(e => e.number)) + 1 : 1
    const ep = await createEpisode(seriesId, season, num, title)
    if (ep) {
      appState = { ...appState, episodes: [...appState.episodes, ep] }
      nav.pendingSeasonNumbers = nav.pendingSeasonNumbers.filter(n => n !== season)
      nav.selectedEpisodeId = ep.id
    }
  }

  async function handleAddEventType(seriesId: string, name: string) {
    const et = await createEventType(seriesId, name)
    if (et) appState = { ...appState, eventTypes: [...appState.eventTypes, et] }
  }

  async function handleDeleteEventType(id: string) {
    await deleteEventType(id)
    appState = {
      ...appState,
      eventTypes: appState.eventTypes.filter(et => et.id !== id),
      tallies: appState.tallies.filter(t => t.eventTypeId !== id),
    }
  }

  async function handleIncrement(episodeId: string, eventTypeId: string) {
    appState = { ...appState, tallies: patchIncrement(appState.tallies, episodeId, eventTypeId) }
    await logEvent(episodeId, eventTypeId, session!.room.id, session!.displayName || null)
  }

  async function handleDecrement(episodeId: string, eventTypeId: string) {
    appState = { ...appState, tallies: patchDecrement(appState.tallies, episodeId, eventTypeId) }
    await undoLastEvent(episodeId, eventTypeId, session!.room.id)
  }

  let newSeriesName = $state('')
</script>

{#if !session}
  <RoomGate {onJoined} />

{:else if loading}
  <div class="min-h-screen flex items-center justify-center text-gray-400 text-sm">
    Laddar rum…
  </div>

{:else}
  <div class="flex flex-col h-screen font-sans text-gray-900 bg-white">

  <!-- Demo mode banner -->
  {#if !isSupabaseConfigured}
    <div class="bg-indigo-50 border-b border-indigo-200 text-indigo-700 text-xs text-center py-1 px-4 shrink-0">
      Demo-läge — data sparas inte, återställs vid omladdning
    </div>
  {/if}

  <!-- Realtime warning banner -->
  {#if isSupabaseConfigured && realtimeStatus !== 'SUBSCRIBED' && realtimeStatus !== 'CONNECTING'}
    <div class="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs text-center py-1 px-4 shrink-0">
      Realtidsanslutning bruten ({realtimeStatus}) — data kan vara inaktuell
    </div>
  {/if}

  <div class="flex flex-1 overflow-hidden">

    <!-- Series sidebar -->
    <aside class="w-64 shrink-0 border-r border-gray-200 flex flex-col gap-4 p-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-gray-800">Serier</h2>
        <span class="text-xs text-gray-400">{session.displayName}</span>
      </div>

      <ul class="flex flex-col gap-1 flex-1 overflow-y-auto">
        {#each appState.series as s (s.id)}
          <li class="flex items-center group">
            <button
              onclick={() => { nav.selectedSeriesId = s.id; nav.selectedEpisodeId = null }}
              class="flex-1 text-left px-2 py-1.5 rounded text-sm transition-colors {
                nav.selectedSeriesId === s.id
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }"
            >
              {s.name}
            </button>
            <button
              onclick={() => handleDeleteSeries(s.id)}
              aria-label="Ta bort {s.name}"
              class="ml-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs px-1"
            >
              ✕
            </button>
          </li>
        {:else}
          <li class="text-sm text-gray-400 italic">Inga serier ännu</li>
        {/each}
      </ul>

      <form onsubmit={handleAddSeries} class="flex gap-1.5">
        <input
          name="name"
          type="text"
          placeholder="Ny serie…"
          bind:value={newSeriesName}
          class="flex-1 min-w-0 px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          class="px-2 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          +
        </button>
      </form>
    </aside>

    <!-- Main panel -->
    <div class="flex flex-col flex-1 overflow-hidden">
      {#if selectedSeries}
        <!-- Tab bar -->
        <div class="flex items-center gap-4 px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">{selectedSeries.name}</h2>
          <div class="flex gap-1 ml-auto">
            {#each ['track', 'stats'] as t (t)}
              <button
                onclick={() => { nav.activeTab = t as 'track' | 'stats' }}
                class="px-3 py-1 rounded text-sm transition-colors {
                  nav.activeTab === t ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }"
              >
                {t === 'track' ? 'Spåra' : 'Statistik'}
              </button>
            {/each}
          </div>
        </div>

        {#if nav.activeTab === 'track'}
          <div class="flex flex-1 overflow-hidden">
            <!-- Season / episode nav -->
            <nav class="w-52 shrink-0 border-r border-gray-200 overflow-y-auto p-3 flex flex-col gap-3" onclick={handleNavClick}>
              {#each allSeasons(selectedSeries) as season (season.id)}
                {@const episodes = getEpisodesForSeason(appState, selectedSeries.id, season.number)}
                {@const isOpen = nav.openSeasonNumber === season.number}
                <div>
                  <button
                    data-season={season.number}
                    class="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-indigo-700 px-1 py-0.5"
                  >
                    <span>Säsong {season.number}</span>
                    <span class="text-gray-400">{isOpen ? '▾' : '▸'}</span>
                  </button>

                  <ul class="mt-1 ml-2 flex flex-col gap-0.5 {isOpen ? '' : 'hidden'}">
                    {#each episodes as ep (ep.id)}
                      <li>
                        <button
                          data-epid={ep.id}
                          class="w-full text-left text-xs px-2 py-1 rounded transition-colors {
                            nav.selectedEpisodeId === ep.id
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }"
                        >
                          E{String(ep.number).padStart(2, '0')}{ep.title ? ` ${ep.title}` : ''}
                        </button>
                      </li>
                    {/each}
                    {#if isOpen}
                      <li>
                        <form
                          onsubmit={(e) => {
                            e.preventDefault()
                            const inp = (e.target as HTMLFormElement).elements.namedItem('title') as HTMLInputElement
                            handleAddEpisode(selectedSeries!.id, season.number, inp.value)
                            inp.value = ''
                          }}
                          class="flex gap-1 mt-0.5"
                        >
                          <input
                            name="title"
                            type="text"
                            placeholder="Avsnittets titel…"
                            class="flex-1 min-w-0 px-2 py-0.5 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button type="submit" class="px-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700">+</button>
                        </form>
                      </li>
                    {/if}
                  </ul>
                </div>
              {/each}

              <button
                onclick={() => handleAddSeason(selectedSeries!)}
                class="text-xs text-indigo-600 hover:underline text-left mt-1"
              >
                + Lägg till säsong
              </button>
            </nav>

            <!-- Tally panel -->
            <main class="flex-1 overflow-y-auto">
              {#if nav.selectedEpisodeId && nav.openSeasonNumber !== null}
                {@const ep = appState.episodes.find(e => e.id === nav.selectedEpisodeId) ?? null}
                {@const seas = selectedSeries ? (allSeasons(selectedSeries).find(s => s.number === nav.openSeasonNumber) ?? null) : null}
                {#if ep && seas}
                  <EpisodeView
                    state={appState}
                    season={seas}
                    episode={ep}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onAddEventType={(name) => handleAddEventType(selectedSeries!.id, name)}
                    onDeleteEventType={handleDeleteEventType}
                  />
                {:else}
                  <div class="p-6 text-sm text-gray-400 italic">Välj ett avsnitt för att börja spåra.</div>
                {/if}
              {:else}
                <div class="p-6 text-sm text-gray-400 italic">
                  Välj ett avsnitt för att börja spåra.
                </div>
              {/if}
            </main>
          </div>

        {:else}
          <StatsView
            state={appState}
            series={selectedSeries}
            seasons={allSeasons(selectedSeries)}
          />
        {/if}

      {:else}
        <div class="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
          Lägg till en serie för att komma igång.
        </div>
      {/if}
    </div>
  </div>
  </div>
{/if}
