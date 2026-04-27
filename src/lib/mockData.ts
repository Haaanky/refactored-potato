import type { AppState, RoomSession } from './types'

export const MOCK_ROOM_ID = 'demo-room'

export const mockSession: RoomSession = {
  room: { id: MOCK_ROOM_ID, room_slug: 'demo', password_hash: '', created_at: '2026-01-01T00:00:00Z' },
  displayName: 'Demo',
}

export function getMockAppState(): AppState {
  return {
    series: [
      { id: 'demo-s1', roomId: MOCK_ROOM_ID, name: 'Star Trek: TNG', createdAt: '2026-01-01T00:00:00Z' },
    ],
    episodes: [
      { id: 'demo-e1', seriesId: 'demo-s1', season: 1, number: 1, title: 'Encounter at Farpoint' },
      { id: 'demo-e2', seriesId: 'demo-s1', season: 1, number: 2, title: 'The Naked Now' },
    ],
    eventTypes: [
      { id: 'demo-et1', seriesId: 'demo-s1', name: 'Catchphrase', emoji: null },
      { id: 'demo-et2', seriesId: 'demo-s1', name: 'Plot hole', emoji: null },
    ],
    tallies: [
      { episodeId: 'demo-e1', eventTypeId: 'demo-et1', count: 3 },
      { episodeId: 'demo-e1', eventTypeId: 'demo-et2', count: 1 },
    ],
  }
}
