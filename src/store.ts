import type { AppState, Series, Season, Episode, EventType, Tally } from './types'

const STORAGE_KEY = 'tvseries-tracker'

const EMPTY_STATE: AppState = {
  series: [],
  seasons: [],
  episodes: [],
  eventTypes: [],
  tallies: [],
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AppState) : EMPTY_STATE
  } catch {
    return EMPTY_STATE
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function uid(): string {
  return crypto.randomUUID()
}

export function addSeries(state: AppState, name: string): AppState {
  const series: Series = { id: uid(), name: name.trim(), createdAt: new Date().toISOString() }
  return { ...state, series: [...state.series, series] }
}

export function deleteSeries(state: AppState, seriesId: string): AppState {
  const seasonIds = state.seasons.filter(s => s.seriesId === seriesId).map(s => s.id)
  const episodeIds = state.episodes.filter(e => seasonIds.includes(e.seasonId)).map(e => e.id)
  return {
    ...state,
    series: state.series.filter(s => s.id !== seriesId),
    seasons: state.seasons.filter(s => s.seriesId !== seriesId),
    episodes: state.episodes.filter(e => !seasonIds.includes(e.seasonId)),
    eventTypes: state.eventTypes.filter(et => et.seriesId !== seriesId),
    tallies: state.tallies.filter(t => !episodeIds.includes(t.episodeId)),
  }
}

export function addSeason(state: AppState, seriesId: string, number: number): AppState {
  const season: Season = { id: uid(), seriesId, number }
  return { ...state, seasons: [...state.seasons, season] }
}

export function addEpisode(state: AppState, seasonId: string, number: number, title: string): AppState {
  const episode: Episode = { id: uid(), seasonId, number, title: title.trim() }
  return { ...state, episodes: [...state.episodes, episode] }
}

export function addEventType(state: AppState, seriesId: string, name: string): AppState {
  const eventType: EventType = { id: uid(), seriesId, name: name.trim() }
  return { ...state, eventTypes: [...state.eventTypes, eventType] }
}

export function deleteEventType(state: AppState, eventTypeId: string): AppState {
  return {
    ...state,
    eventTypes: state.eventTypes.filter(et => et.id !== eventTypeId),
    tallies: state.tallies.filter(t => t.eventTypeId !== eventTypeId),
  }
}

export function increment(state: AppState, episodeId: string, eventTypeId: string): AppState {
  const existing = state.tallies.find(t => t.episodeId === episodeId && t.eventTypeId === eventTypeId)
  if (existing) {
    return {
      ...state,
      tallies: state.tallies.map(t =>
        t.episodeId === episodeId && t.eventTypeId === eventTypeId
          ? { ...t, count: t.count + 1 }
          : t
      ),
    }
  }
  const tally: Tally = { episodeId, eventTypeId, count: 1 }
  return { ...state, tallies: [...state.tallies, tally] }
}

export function decrement(state: AppState, episodeId: string, eventTypeId: string): AppState {
  return {
    ...state,
    tallies: state.tallies
      .map(t =>
        t.episodeId === episodeId && t.eventTypeId === eventTypeId
          ? { ...t, count: Math.max(0, t.count - 1) }
          : t
      )
      .filter(t => t.count > 0),
  }
}

export function getTally(state: AppState, episodeId: string, eventTypeId: string): number {
  return state.tallies.find(t => t.episodeId === episodeId && t.eventTypeId === eventTypeId)?.count ?? 0
}

export function getSeasonStats(
  state: AppState,
  seasonId: string
): Record<string, number> {
  const episodeIds = state.episodes.filter(e => e.seasonId === seasonId).map(e => e.id)
  const result: Record<string, number> = {}
  for (const tally of state.tallies) {
    if (episodeIds.includes(tally.episodeId)) {
      result[tally.eventTypeId] = (result[tally.eventTypeId] ?? 0) + tally.count
    }
  }
  return result
}
