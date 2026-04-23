import { useState } from 'react'
import type { AppState, Series, Season, Episode } from '../types'
import { getSeasonStats } from '../store'
import { InlineForm } from './InlineForm'
import { EpisodeView } from './EpisodeView'
import { Button } from './Button'

interface Props {
  state: AppState
  series: Series
  onAddSeason: (seriesId: string, number: number) => void
  onAddEpisode: (seasonId: string, number: number, title: string) => void
  onAddEventType: (seriesId: string, name: string) => void
  onDeleteEventType: (id: string) => void
  onIncrement: (episodeId: string, eventTypeId: string) => void
  onDecrement: (episodeId: string, eventTypeId: string) => void
}

export function SeriesDetail({
  state,
  series,
  onAddSeason,
  onAddEpisode,
  onAddEventType,
  onDeleteEventType,
  onIncrement,
  onDecrement,
}: Props) {
  const seasons = state.seasons
    .filter(s => s.seriesId === series.id)
    .sort((a, b) => a.number - b.number)

  const [openSeasonId, setOpenSeasonId] = useState<string | null>(seasons[0]?.id ?? null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [tab, setTab] = useState<'track' | 'stats'>('track')

  const openSeason = seasons.find(s => s.id === openSeasonId) ?? null

  const episodesForSeason = (season: Season) =>
    state.episodes
      .filter(e => e.seasonId === season.id)
      .sort((a, b) => a.number - b.number)

  function handleAddSeason() {
    const nextNumber = seasons.length > 0 ? Math.max(...seasons.map(s => s.number)) + 1 : 1
    onAddSeason(series.id, nextNumber)
  }

  function handleAddEpisode(seasonId: string, title: string) {
    const episodes = state.episodes.filter(e => e.seasonId === seasonId)
    const nextNumber = episodes.length > 0 ? Math.max(...episodes.map(e => e.number)) + 1 : 1
    onAddEpisode(seasonId, nextNumber, title)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{series.name}</h2>
        <div className="flex gap-1 ml-auto">
          {(['track', 'stats'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                tab === t ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t === 'track' ? 'Track' : 'Statistics'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'track' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Season / episode nav */}
          <nav className="w-52 shrink-0 border-r border-gray-200 overflow-y-auto p-3 flex flex-col gap-3">
            {seasons.map(season => {
              const episodes = episodesForSeason(season)
              const isOpen = season.id === openSeasonId
              return (
                <div key={season.id}>
                  <button
                    onClick={() => setOpenSeasonId(isOpen ? null : season.id)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-indigo-700 px-1 py-0.5"
                  >
                    <span>Season {season.number}</span>
                    <span className="text-gray-400">{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <ul className="mt-1 ml-2 flex flex-col gap-0.5">
                      {episodes.map(ep => (
                        <li key={ep.id}>
                          <button
                            onClick={() => setSelectedEpisode(ep)}
                            className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                              selectedEpisode?.id === ep.id
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            E{String(ep.number).padStart(2, '0')}
                            {ep.title ? ` ${ep.title}` : ''}
                          </button>
                        </li>
                      ))}
                      <li>
                        <InlineForm
                          placeholder="Episode title…"
                          buttonLabel="+"
                          onSubmit={title => handleAddEpisode(season.id, title)}
                        />
                      </li>
                    </ul>
                  )}
                </div>
              )
            })}
            <Button onClick={handleAddSeason} variant="ghost" className="text-xs mt-1">
              + Add season
            </Button>
          </nav>

          {/* Tally panel */}
          <main className="flex-1 overflow-y-auto">
            {selectedEpisode && openSeason ? (
              <EpisodeView
                state={state}
                season={openSeason}
                episode={selectedEpisode}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onAddEventType={name => onAddEventType(series.id, name)}
                onDeleteEventType={onDeleteEventType}
              />
            ) : (
              <div className="p-6 text-sm text-gray-400 italic">
                Select an episode to start tracking.
              </div>
            )}
          </main>
        </div>
      )}

      {tab === 'stats' && (
        <StatsView state={state} series={series} seasons={seasons} />
      )}
    </div>
  )
}

function StatsView({
  state,
  series,
  seasons,
}: {
  state: AppState
  series: Series
  seasons: Season[]
}) {
  const eventTypes = state.eventTypes.filter(et => et.seriesId === series.id)

  if (eventTypes.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-400 italic">
        No event types tracked yet.
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pb-2 pr-4 font-medium">Season</th>
            {eventTypes.map(et => (
              <th key={et.id} className="pb-2 pr-4 font-medium">{et.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {seasons.map(season => {
            const stats = getSeasonStats(state, season.id)
            return (
              <tr key={season.id} className="border-t border-gray-100">
                <td className="py-2 pr-4 text-gray-700">Season {season.number}</td>
                {eventTypes.map(et => (
                  <td key={et.id} className="py-2 pr-4 font-mono text-gray-900">
                    {stats[et.id] ?? 0}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="py-2 pr-4 text-gray-700">Total</td>
            {eventTypes.map(et => {
              const total = seasons.reduce((sum, s) => {
                const stats = getSeasonStats(state, s.id)
                return sum + (stats[et.id] ?? 0)
              }, 0)
              return (
                <td key={et.id} className="py-2 pr-4 font-mono text-indigo-700">
                  {total}
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
