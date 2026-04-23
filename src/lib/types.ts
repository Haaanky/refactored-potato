// ── Supabase DB row types ─────────────────────────────────────────────────────

export interface DbRoom {
  id: string
  room_slug: string
  password_hash: string
  created_at: string
}

export interface DbSeries {
  id: string
  room_id: string
  title: string
  created_at: string
}

export interface DbEventType {
  id: string
  series_id: string
  label: string
  emoji: string | null
}

export interface DbEpisode {
  id: string
  series_id: string
  season: number
  episode: number
  title: string | null
}

export interface DbEvent {
  id: string
  episode_id: string
  event_type_id: string
  room_id: string
  logged_by: string | null
  deleted: boolean
  created_at: string
}

// ── App domain types ──────────────────────────────────────────────────────────

export interface Series {
  id: string
  roomId: string
  name: string
  createdAt: string
}

// Derived from unique episode.season values — not a separate DB table
export interface Season {
  id: string   // deterministic: `${seriesId}-s${number}`
  seriesId: string
  number: number
}

export interface Episode {
  id: string
  seriesId: string
  season: number
  number: number
  title: string
}

export interface EventType {
  id: string
  seriesId: string
  name: string
  emoji: string | null
}

// Derived by counting non-deleted Event rows per (episode, eventType)
export interface Tally {
  episodeId: string
  eventTypeId: string
  count: number
}

// ── Session ───────────────────────────────────────────────────────────────────

export interface RoomSession {
  room: DbRoom
  displayName: string
}

// ── App state (in-memory, Supabase-sourced) ───────────────────────────────────

export interface AppState {
  series: Series[]
  episodes: Episode[]
  eventTypes: EventType[]
  tallies: Tally[]
}
