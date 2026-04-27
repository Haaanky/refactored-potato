import type { AppState, Series, Episode, EventType, Tally, Season, DbEvent } from './types'

export const EMPTY_STATE: AppState = {
  series: [],
  episodes: [],
  eventTypes: [],
  tallies: [],
}

// ── Derived helpers ───────────────────────────────────────────────────────────

export function getSeasons(state: AppState, seriesId: string): Season[] {
  const nums = [...new Set(
    state.episodes.filter(e => e.seriesId === seriesId).map(e => e.season),
  )].sort((a, b) => a - b)
  return nums.map(num => ({ id: `${seriesId}-s${num}`, seriesId, number: num }))
}

export function getEpisodesForSeason(
  state: AppState,
  seriesId: string,
  season: number,
): Episode[] {
  return state.episodes
    .filter(e => e.seriesId === seriesId && e.season === season)
    .sort((a, b) => a.number - b.number)
}

export function getTally(
  state: AppState,
  episodeId: string,
  eventTypeId: string,
): number {
  return (
    state.tallies.find(
      t => t.episodeId === episodeId && t.eventTypeId === eventTypeId,
    )?.count ?? 0
  )
}

export function getSeasonStats(
  state: AppState,
  seriesId: string,
  season: number,
): Record<string, number> {
  const episodeIds = state.episodes
    .filter(e => e.seriesId === seriesId && e.season === season)
    .map(e => e.id)
  const result: Record<string, number> = {}
  for (const tally of state.tallies) {
    if (episodeIds.includes(tally.episodeId)) {
      result[tally.eventTypeId] = (result[tally.eventTypeId] ?? 0) + tally.count
    }
  }
  return result
}

// ── DB row → domain type mappers ──────────────────────────────────────────────

export function mapSeries(row: {
  id: string; room_id: string; title: string; created_at: string
}): Series {
  return { id: row.id, roomId: row.room_id, name: row.title, createdAt: row.created_at }
}

export function mapEpisode(row: {
  id: string; series_id: string; season: number; episode: number; title: string | null
}): Episode {
  return {
    id: row.id,
    seriesId: row.series_id,
    season: row.season,
    number: row.episode,
    title: row.title ?? '',
  }
}

export function mapEventType(row: {
  id: string; series_id: string; label: string; emoji: string | null
}): EventType {
  return { id: row.id, seriesId: row.series_id, name: row.label, emoji: row.emoji }
}

// ── Tally derivation from raw Event rows ──────────────────────────────────────

export function tallyFromEvents(events: DbEvent[]): Tally[] {
  const counts = new Map<string, number>()
  for (const ev of events) {
    if (ev.deleted) continue
    const key = `${ev.episode_id}|${ev.event_type_id}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries()).map(([key, count]) => {
    const [episodeId, eventTypeId] = key.split('|')
    return { episodeId, eventTypeId, count }
  })
}

// ── Optimistic tally patches ──────────────────────────────────────────────────

export function patchIncrement(
  tallies: Tally[],
  episodeId: string,
  eventTypeId: string,
): Tally[] {
  const existing = tallies.find(
    t => t.episodeId === episodeId && t.eventTypeId === eventTypeId,
  )
  if (existing) {
    return tallies.map(t =>
      t.episodeId === episodeId && t.eventTypeId === eventTypeId
        ? { ...t, count: t.count + 1 }
        : t,
    )
  }
  return [...tallies, { episodeId, eventTypeId, count: 1 }]
}

export function patchDecrement(
  tallies: Tally[],
  episodeId: string,
  eventTypeId: string,
): Tally[] {
  return tallies
    .map(t =>
      t.episodeId === episodeId && t.eventTypeId === eventTypeId
        ? { ...t, count: Math.max(0, t.count - 1) }
        : t,
    )
    .filter(t => t.count > 0)
}
