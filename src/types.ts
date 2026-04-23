export interface Series {
  id: string
  name: string
  createdAt: string
}

export interface Season {
  id: string
  seriesId: string
  number: number
}

export interface Episode {
  id: string
  seasonId: string
  number: number
  title: string
}

export interface EventType {
  id: string
  seriesId: string
  name: string
}

export interface Tally {
  episodeId: string
  eventTypeId: string
  count: number
}

export interface AppState {
  series: Series[]
  seasons: Season[]
  episodes: Episode[]
  eventTypes: EventType[]
  tallies: Tally[]
}
