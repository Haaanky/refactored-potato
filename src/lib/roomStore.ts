import { supabase } from './supabase'
import { mapSeries, mapEpisode, mapEventType, tallyFromEvents } from './store'
import type { DbRoom, DbEvent, AppState, Series, Episode, EventType } from './types'

// ── Room management ───────────────────────────────────────────────────────────

export async function createRoom(slug: string, passwordHash: string): Promise<DbRoom | null> {
  const { data, error } = await supabase
    .from('rooms')
    .insert({ room_slug: slug, password_hash: passwordHash })
    .select()
    .single()
  if (error || !data) return null
  return data as DbRoom
}

export async function joinRoom(slug: string, passwordHash: string): Promise<DbRoom | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select()
    .eq('room_slug', slug)
    .single()
  if (error || !data) return null
  const room = data as DbRoom
  return room.password_hash === passwordHash ? room : null
}

// ── Data loading ──────────────────────────────────────────────────────────────

export async function loadRoomData(roomId: string): Promise<AppState> {
  const { data: rawSeries } = await supabase.from('series').select().eq('room_id', roomId)
  const dbSeries = (rawSeries ?? []) as Array<{
    id: string; room_id: string; title: string; created_at: string
  }>
  const seriesIds = dbSeries.map(s => s.id)

  const [epsRes, etRes, eventsRes] = await Promise.all([
    seriesIds.length > 0
      ? supabase.from('episodes').select().in('series_id', seriesIds)
      : Promise.resolve({ data: [] }),
    seriesIds.length > 0
      ? supabase.from('event_types').select().in('series_id', seriesIds)
      : Promise.resolve({ data: [] }),
    supabase.from('events').select().eq('room_id', roomId),
  ])

  return {
    series: dbSeries.map(mapSeries),
    episodes: ((epsRes.data ?? []) as Parameters<typeof mapEpisode>[0][]).map(mapEpisode),
    eventTypes: ((etRes.data ?? []) as Parameters<typeof mapEventType>[0][]).map(mapEventType),
    tallies: tallyFromEvents((eventsRes.data ?? []) as DbEvent[]),
  }
}

// ── Event logging ─────────────────────────────────────────────────────────────

export async function logEvent(
  episodeId: string,
  eventTypeId: string,
  roomId: string,
  loggedBy: string | null,
): Promise<DbEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .insert({ episode_id: episodeId, event_type_id: eventTypeId, room_id: roomId, logged_by: loggedBy, deleted: false })
    .select()
    .single()
  if (error || !data) return null
  return data as DbEvent
}

export async function undoLastEvent(
  episodeId: string,
  eventTypeId: string,
  roomId: string,
): Promise<boolean> {
  const { data: found, error: findErr } = await supabase
    .from('events')
    .select('id')
    .eq('episode_id', episodeId)
    .eq('event_type_id', eventTypeId)
    .eq('room_id', roomId)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (findErr || !found) return false
  const { error } = await supabase
    .from('events')
    .update({ deleted: true })
    .eq('id', (found as { id: string }).id)
  return !error
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function createSeries(roomId: string, title: string): Promise<Series | null> {
  const { data, error } = await supabase
    .from('series')
    .insert({ room_id: roomId, title })
    .select()
    .single()
  if (error || !data) return null
  return mapSeries(data as Parameters<typeof mapSeries>[0])
}

export async function deleteSeries(seriesId: string): Promise<boolean> {
  const { error } = await supabase.from('series').delete().eq('id', seriesId)
  return !error
}

export async function createEpisode(
  seriesId: string,
  season: number,
  episodeNumber: number,
  title: string,
): Promise<Episode | null> {
  const { data, error } = await supabase
    .from('episodes')
    .insert({ series_id: seriesId, season, episode: episodeNumber, title: title || null })
    .select()
    .single()
  if (error || !data) return null
  return mapEpisode(data as Parameters<typeof mapEpisode>[0])
}

export async function createEventType(seriesId: string, label: string): Promise<EventType | null> {
  const { data, error } = await supabase
    .from('event_types')
    .insert({ series_id: seriesId, label })
    .select()
    .single()
  if (error || !data) return null
  return mapEventType(data as Parameters<typeof mapEventType>[0])
}

export async function deleteEventType(eventTypeId: string): Promise<boolean> {
  const { error } = await supabase.from('event_types').delete().eq('id', eventTypeId)
  return !error
}
