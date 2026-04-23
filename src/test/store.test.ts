import { describe, it, expect } from 'vitest'
import {
  addSeries,
  deleteSeries,
  addSeason,
  addEpisode,
  addEventType,
  deleteEventType,
  increment,
  decrement,
  getTally,
  getSeasonStats,
} from '../store'
import type { AppState } from '../types'

const empty: AppState = { series: [], seasons: [], episodes: [], eventTypes: [], tallies: [] }

describe('addSeries', () => {
  it('appends a series with trimmed name', () => {
    const state = addSeries(empty, '  Breaking Bad  ')
    expect(state.series).toHaveLength(1)
    expect(state.series[0].name).toBe('Breaking Bad')
  })
})

describe('deleteSeries', () => {
  it('removes the series and all related data', () => {
    let state = addSeries(empty, 'Show A')
    const seriesId = state.series[0].id
    state = addSeason(state, seriesId, 1)
    const seasonId = state.seasons[0].id
    state = addEpisode(state, seasonId, 1, 'Pilot')
    const episodeId = state.episodes[0].id
    state = addEventType(state, seriesId, 'Catchphrase')
    const eventTypeId = state.eventTypes[0].id
    state = increment(state, episodeId, eventTypeId)

    state = deleteSeries(state, seriesId)

    expect(state.series).toHaveLength(0)
    expect(state.seasons).toHaveLength(0)
    expect(state.episodes).toHaveLength(0)
    expect(state.eventTypes).toHaveLength(0)
    expect(state.tallies).toHaveLength(0)
  })
})

describe('increment / decrement', () => {
  it('creates a tally on first increment', () => {
    let state = addSeries(empty, 'S')
    const sid = state.series[0].id
    state = addSeason(state, sid, 1)
    state = addEpisode(state, state.seasons[0].id, 1, 'E1')
    state = addEventType(state, sid, 'Laugh')
    const eid = state.episodes[0].id
    const etid = state.eventTypes[0].id

    state = increment(state, eid, etid)
    expect(getTally(state, eid, etid)).toBe(1)

    state = increment(state, eid, etid)
    expect(getTally(state, eid, etid)).toBe(2)

    state = decrement(state, eid, etid)
    expect(getTally(state, eid, etid)).toBe(1)
  })

  it('removes tally record when count reaches zero', () => {
    let state = addSeries(empty, 'S')
    const sid = state.series[0].id
    state = addSeason(state, sid, 1)
    state = addEpisode(state, state.seasons[0].id, 1, 'E1')
    state = addEventType(state, sid, 'Laugh')
    const eid = state.episodes[0].id
    const etid = state.eventTypes[0].id

    state = increment(state, eid, etid)
    state = decrement(state, eid, etid)
    expect(state.tallies).toHaveLength(0)
  })
})

describe('getSeasonStats', () => {
  it('sums tallies across all episodes in a season', () => {
    let state = addSeries(empty, 'S')
    const sid = state.series[0].id
    state = addSeason(state, sid, 1)
    const seasonId = state.seasons[0].id
    state = addEpisode(state, seasonId, 1, 'E1')
    state = addEpisode(state, seasonId, 2, 'E2')
    state = addEventType(state, sid, 'Laugh')
    const [e1, e2] = state.episodes.map(e => e.id)
    const etid = state.eventTypes[0].id

    state = increment(state, e1, etid)
    state = increment(state, e1, etid)
    state = increment(state, e2, etid)

    const stats = getSeasonStats(state, seasonId)
    expect(stats[etid]).toBe(3)
  })
})

describe('deleteEventType', () => {
  it('removes the event type and all its tallies', () => {
    let state = addSeries(empty, 'S')
    const sid = state.series[0].id
    state = addSeason(state, sid, 1)
    state = addEpisode(state, state.seasons[0].id, 1, 'E1')
    state = addEventType(state, sid, 'Laugh')
    const eid = state.episodes[0].id
    const etid = state.eventTypes[0].id
    state = increment(state, eid, etid)

    state = deleteEventType(state, etid)
    expect(state.eventTypes).toHaveLength(0)
    expect(state.tallies).toHaveLength(0)
  })
})
