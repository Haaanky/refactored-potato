import { describe, it, expect } from 'vitest'
import {
  getSeasons,
  getEpisodesForSeason,
  getTally,
  getSeasonStats,
  tallyFromEvents,
  patchIncrement,
  patchDecrement,
  mapSeries,
  mapEpisode,
  mapEventType,
} from '../lib/store'
import type { AppState, DbEvent } from '../lib/types'

const S = 'series-1'
const E1 = 'ep-1'
const E2 = 'ep-2'
const ET = 'et-1'

const base: AppState = {
  series: [{ id: S, roomId: 'r1', name: 'Breaking Bad', createdAt: '' }],
  episodes: [
    { id: E1, seriesId: S, season: 1, number: 1, title: 'Pilot' },
    { id: E2, seriesId: S, season: 1, number: 2, title: 'Cat\'s in the Bag' },
    { id: 'ep-3', seriesId: S, season: 2, number: 1, title: 'Seven Thirty-Seven' },
  ],
  eventTypes: [{ id: ET, seriesId: S, name: 'Catchphrase', emoji: null }],
  tallies: [],
}

describe('getSeasons', () => {
  it('derives unique sorted seasons from episodes', () => {
    const seasons = getSeasons(base, S)
    expect(seasons).toHaveLength(2)
    expect(seasons[0].number).toBe(1)
    expect(seasons[1].number).toBe(2)
    expect(seasons[0].id).toBe(`${S}-s1`)
  })
})

describe('getEpisodesForSeason', () => {
  it('returns episodes for a season sorted by number', () => {
    const eps = getEpisodesForSeason(base, S, 1)
    expect(eps).toHaveLength(2)
    expect(eps[0].number).toBe(1)
    expect(eps[1].number).toBe(2)
  })

  it('returns empty array for unknown season', () => {
    expect(getEpisodesForSeason(base, S, 99)).toHaveLength(0)
  })
})

describe('getTally', () => {
  it('returns 0 when no tally exists', () => {
    expect(getTally(base, E1, ET)).toBe(0)
  })

  it('returns count when tally exists', () => {
    const state = { ...base, tallies: [{ episodeId: E1, eventTypeId: ET, count: 3 }] }
    expect(getTally(state, E1, ET)).toBe(3)
  })
})

describe('getSeasonStats', () => {
  it('sums tallies across all episodes in a season', () => {
    const state = {
      ...base,
      tallies: [
        { episodeId: E1, eventTypeId: ET, count: 2 },
        { episodeId: E2, eventTypeId: ET, count: 1 },
      ],
    }
    const stats = getSeasonStats(state, S, 1)
    expect(stats[ET]).toBe(3)
  })
})

describe('tallyFromEvents', () => {
  it('counts non-deleted events', () => {
    const events: DbEvent[] = [
      { id: '1', episode_id: E1, event_type_id: ET, room_id: 'r1', logged_by: null, deleted: false, created_at: '' },
      { id: '2', episode_id: E1, event_type_id: ET, room_id: 'r1', logged_by: null, deleted: false, created_at: '' },
      { id: '3', episode_id: E1, event_type_id: ET, room_id: 'r1', logged_by: null, deleted: true, created_at: '' },
    ]
    const tallies = tallyFromEvents(events)
    expect(tallies).toHaveLength(1)
    expect(tallies[0].count).toBe(2)
  })

  it('returns empty array when all events are deleted', () => {
    const events: DbEvent[] = [
      { id: '1', episode_id: E1, event_type_id: ET, room_id: 'r1', logged_by: null, deleted: true, created_at: '' },
    ]
    expect(tallyFromEvents(events)).toHaveLength(0)
  })
})

describe('patchIncrement', () => {
  it('creates a new tally if none exists', () => {
    const result = patchIncrement([], E1, ET)
    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(1)
  })

  it('increments an existing tally', () => {
    const tallies = [{ episodeId: E1, eventTypeId: ET, count: 2 }]
    const result = patchIncrement(tallies, E1, ET)
    expect(result[0].count).toBe(3)
  })
})

describe('patchDecrement', () => {
  it('decrements an existing tally', () => {
    const tallies = [{ episodeId: E1, eventTypeId: ET, count: 2 }]
    expect(patchDecrement(tallies, E1, ET)[0].count).toBe(1)
  })

  it('removes the tally when count reaches zero', () => {
    const tallies = [{ episodeId: E1, eventTypeId: ET, count: 1 }]
    expect(patchDecrement(tallies, E1, ET)).toHaveLength(0)
  })
})

describe('mapper functions', () => {
  it('mapSeries converts DB row to Series', () => {
    const row = { id: '1', room_id: 'r1', title: 'Breaking Bad', created_at: '2024-01-01' }
    const s = mapSeries(row)
    expect(s.name).toBe('Breaking Bad')
    expect(s.roomId).toBe('r1')
  })

  it('mapEpisode converts DB row to Episode', () => {
    const row = { id: 'e1', series_id: 's1', season: 2, episode: 3, title: 'Ep title' }
    const ep = mapEpisode(row)
    expect(ep.season).toBe(2)
    expect(ep.number).toBe(3)
  })

  it('mapEventType converts DB row to EventType', () => {
    const row = { id: 'et1', series_id: 's1', label: 'Catchphrase', emoji: '🎤' }
    const et = mapEventType(row)
    expect(et.name).toBe('Catchphrase')
    expect(et.emoji).toBe('🎤')
  })
})
