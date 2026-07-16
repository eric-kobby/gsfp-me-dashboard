import type { Slice } from '../data/types'
import { TERMS } from '../data/dataset'
import { indicatorById, type Indicator } from '../lib/metrics'
import { isFail } from '../lib/format'
import { Sparkline } from './charts/Sparkline'

const TILE_IDS = ['visits', 'schools', 'pupils', 'screened', 'cooksCert', 'menu', 'quality', 'mealUptake']

interface Props {
  slice: Slice
  /** Geography-only slice (ignores term filter) — drives the term sparkline. */
  trendSlice: Slice
  onDrill: (indicator: Indicator) => void
}

function termSeries(ind: Indicator, trendSlice: Slice): (number | null)[] {
  return TERMS.map((t) => {
    const subs = trendSlice.subs.filter((s) => s.term === t)
    const cats = trendSlice.cats.filter((c) => c.term === t)
    return subs.length ? ind.aggregate({ subs, cats }).value : null
  })
}

/** 01 · Scorecard — a 4×2 ledger grid. No cards: columns are separated by gaps,
    cells by a single hairline. A failing KPI turns its kicker and number red. */
export function KpiGrid({ slice, trendSlice, onDrill }: Props) {
  return (
    <div className="kpi-grid">
      {TILE_IDS.map((id) => {
        const ind = indicatorById(id)
        const agg = ind.aggregate(slice)
        const series = termSeries(ind, trendSlice)
        const present = series.filter((v): v is number => v != null)
        const delta = present.length >= 2 ? present[present.length - 1] - present[0] : null
        const fail = ind.unit === 'percent' && isFail(agg.value)
        const unitSuffix = ind.unit === 'percent' ? 'pt' : ''
        return (
          <button
            key={id}
            className={`kpi${fail ? ' fail' : ''}`}
            onClick={() => onDrill(ind)}
            aria-label={`${ind.label}: ${agg.display}. Open breakdown.`}
          >
            <span className="kpi-main">
              <span className="kpi-k">{ind.label}</span>
              <span className="kpi-val">
                {agg.display}
                {delta != null && delta !== 0 && (
                  <span className={`delta ${delta > 0 ? 'up' : 'down'}`}>
                    {' '}
                    {delta > 0 ? '▲' : '▼'}
                    {Math.abs(Math.round(delta))}
                    {unitSuffix}
                  </span>
                )}
              </span>
            </span>
            <span className="kpi-spark">
              <Sparkline points={series} colorVar={fail ? '--crit' : '--seq4'} />
            </span>
          </button>
        )
      })}
    </div>
  )
}
