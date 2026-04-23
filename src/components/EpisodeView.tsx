import type { AppState, Episode, Season } from '../types'
import { getTally } from '../store'
import { TallyRow } from './TallyRow'
import { InlineForm } from './InlineForm'

interface Props {
  state: AppState
  season: Season
  episode: Episode
  onIncrement: (episodeId: string, eventTypeId: string) => void
  onDecrement: (episodeId: string, eventTypeId: string) => void
  onAddEventType: (name: string) => void
  onDeleteEventType: (id: string) => void
}

export function EpisodeView({
  state,
  season,
  episode,
  onIncrement,
  onDecrement,
  onAddEventType,
  onDeleteEventType,
}: Props) {
  const eventTypes = state.eventTypes.filter(et => et.seriesId === season.seriesId)

  return (
    <div className="p-6 max-w-xl">
      <h3 className="font-semibold text-gray-800 mb-4">
        S{String(season.number).padStart(2, '0')}E{String(episode.number).padStart(2, '0')}
        {episode.title ? ` — ${episode.title}` : ''}
      </h3>

      {eventTypes.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-4">
          No event types yet. Add one below to start tracking.
        </p>
      ) : (
        <ul className="mb-4">
          {eventTypes.map(et => (
            <TallyRow
              key={et.id}
              eventType={et}
              count={getTally(state, episode.id, et.id)}
              onIncrement={() => onIncrement(episode.id, et.id)}
              onDecrement={() => onDecrement(episode.id, et.id)}
              onDelete={() => onDeleteEventType(et.id)}
            />
          ))}
        </ul>
      )}

      <InlineForm
        placeholder='New event type, e.g. "Walter says his name"'
        onSubmit={onAddEventType}
      />
    </div>
  )
}
