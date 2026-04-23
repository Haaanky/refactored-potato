import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { DbEvent, Tally } from './types'

export type EventPayload = {
  new: DbEvent
  old: Partial<DbEvent>
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

export function subscribeToEvents(
  roomId: string,
  onEvent: (payload: EventPayload) => void,
  onStatusChange?: (status: string) => void,
): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`room-events-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events', filter: `room_id=eq.${roomId}` },
      payload => onEvent({
        new: payload.new as DbEvent,
        old: payload.old as Partial<DbEvent>,
        eventType: payload.eventType as EventPayload['eventType'],
      }),
    )
    .subscribe(status => onStatusChange?.(status))

  return () => { void supabase.removeChannel(channel) }
}

export function applyEventPayload(tallies: Tally[], payload: EventPayload): Tally[] {
  const ev = payload.new
  if (!ev?.episode_id || !ev?.event_type_id) return tallies

  const matches = (t: Tally) =>
    t.episodeId === ev.episode_id && t.eventTypeId === ev.event_type_id

  if (payload.eventType === 'INSERT' && !ev.deleted) {
    const existing = tallies.find(matches)
    if (existing) return tallies.map(t => matches(t) ? { ...t, count: t.count + 1 } : t)
    return [...tallies, { episodeId: ev.episode_id, eventTypeId: ev.event_type_id, count: 1 }]
  }

  if (payload.eventType === 'UPDATE' && ev.deleted) {
    return tallies
      .map(t => matches(t) ? { ...t, count: Math.max(0, t.count - 1) } : t)
      .filter(t => t.count > 0)
  }

  return tallies
}
