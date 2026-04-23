import { useState, useCallback } from 'react'
import {
  loadState,
  saveState,
  addSeries,
  deleteSeries,
  addSeason,
  addEpisode,
  addEventType,
  deleteEventType,
  increment,
  decrement,
} from './store'
import type { AppState } from './types'
import { SeriesList } from './components/SeriesList'
import { SeriesDetail } from './components/SeriesDetail'

function useAppState() {
  const [state, setState] = useState<AppState>(loadState)

  const update = useCallback((next: AppState) => {
    saveState(next)
    setState(next)
  }, [])

  return { state, update }
}

export function App() {
  const { state, update } = useAppState()
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(
    state.series[0]?.id ?? null
  )

  const selectedSeries = state.series.find(s => s.id === selectedSeriesId) ?? null

  return (
    <div className="flex h-screen overflow-hidden font-sans text-gray-900 bg-white">
      <SeriesList
        series={state.series}
        selectedId={selectedSeriesId}
        onSelect={setSelectedSeriesId}
        onAdd={name => {
          const next = addSeries(state, name)
          update(next)
          setSelectedSeriesId(next.series.at(-1)!.id)
        }}
        onDelete={id => {
          update(deleteSeries(state, id))
          if (selectedSeriesId === id) setSelectedSeriesId(state.series.find(s => s.id !== id)?.id ?? null)
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {selectedSeries ? (
          <SeriesDetail
            state={state}
            series={selectedSeries}
            onAddSeason={(seriesId, number) => update(addSeason(state, seriesId, number))}
            onAddEpisode={(seasonId, number, title) => update(addEpisode(state, seasonId, number, title))}
            onAddEventType={(seriesId, name) => update(addEventType(state, seriesId, name))}
            onDeleteEventType={id => update(deleteEventType(state, id))}
            onIncrement={(eid, etid) => update(increment(state, eid, etid))}
            onDecrement={(eid, etid) => update(decrement(state, eid, etid))}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
            Add a series to get started.
          </div>
        )}
      </div>
    </div>
  )
}

export default App
