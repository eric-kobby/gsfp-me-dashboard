import type { Slice } from '../../data/types'
import { TERMS } from '../../data/dataset'
import { indicatorById } from '../../lib/metrics'
import { isFail } from '../../lib/format'
import { Section } from '../Section'
import { LineChart, type LineSeries } from '../charts/LineChart'

// Series in legend order. The declining line is drawn dashed and flagged.
const TRACKED: { id: string; colorVar: string }[] = [
  { id: 'mealUptake', colorVar: '--s1' },
  { id: 'menu', colorVar: '--s3' },
  { id: 'screened', colorVar: '--s2' },
  { id: 'cooksCert', colorVar: '--s4' },
]

const shortTerm = (t: string) => t.replace(' Term', '')

/** `slice` is filtered by geography only — the arc always spans all terms. */
export function TrendSection({ slice }: { slice: Slice }) {
  const perTerm = TERMS.map((t) => ({
    subs: slice.subs.filter((s) => s.term === t),
    cats: slice.cats.filter((c) => c.term === t),
  }))

  const raw = TRACKED.map(({ id, colorVar }) => {
    const ind = indicatorById(id)
    const points = perTerm.map((slc) => (slc.subs.length ? ind.aggregate(slc).value : null))
    const present = points.filter((p): p is number => p != null)
    return { id, label: ind.label, colorVar, points, current: present.length ? present[present.length - 1] : null }
  })

  // Exactly one watch line: the weakest series, and only if it is actually below
  // the "good" threshold. It is drawn dashed and flagged in --crit.
  const weakest = raw
    .filter((s) => s.current != null)
    .sort((a, b) => (a.current as number) - (b.current as number))[0]
  const watchId = weakest && ((weakest.current as number) < 75 || isFail(weakest.current as number)) ? weakest.id : null

  const series: (LineSeries & { current: number | null; falling: boolean })[] = raw.map((s) => ({
    ...s,
    dashed: s.id === watchId,
    falling: s.id === watchId,
  }))

  const volume = perTerm.map((p) => p.subs.length)
  const anyData = volume.some((v) => v > 0)

  return (
    <Section
      id="trends"
      num="03"
      title="Trends"
      note="four indicators across terms · hover crosshair · % of visits · all terms regardless of term filter"
    >
      {anyData ? (
        <div className="trend-grid">
          <LineChart xLabels={TERMS.map((t) => `${shortTerm(t)} term`)} series={series} yMin={40} yMax={100} unit="%" />
          <div className="trend-legend">
            {series.map((s) => (
              <div className={`tl${s.falling ? ' fail' : ''}`} key={s.id}>
                <span
                  className="sw"
                  style={{
                    background: s.dashed
                      ? `repeating-linear-gradient(90deg, var(${s.colorVar}) 0 4px, transparent 4px 7px)`
                      : `var(${s.colorVar})`,
                  }}
                />
                <span className="nm">
                  {s.label}
                  {s.falling ? ' ↓' : ''}
                </span>
                <span className="v tnum">{s.current ?? '—'}</span>
              </div>
            ))}
            <div className="foot tnum">Monitoring volume: {volume.join(' → ')} visits</div>
          </div>
        </div>
      ) : (
        <div className="empty">No visits in this selection</div>
      )}
    </Section>
  )
}
