import { useEffect, useMemo, useState } from 'react'
import type { Slice, Dimension, Filters } from '../data/types'
import type { Indicator } from '../lib/metrics'
import { DRILL_ORDER, breakdown, applyPath, dimLabel, distinctSchools } from '../lib/metrics'
import { SUBMISSIONS, CATERERS, shortRegion } from '../data/dataset'
import { n, statusVar, isFail } from '../lib/format'
import { BarList, type BarDatum } from './charts/BarList'
import { Donut } from './charts/Donut'

interface Step {
  dim: Dimension
  key: string
  label: string
}

interface Props {
  indicator: Indicator
  base: Slice
  filters: Filters
  onClose: () => void
}

/** How many drill levels the active filters have already consumed. */
function startIndex(filters: Filters): number {
  if (filters.district) return 2
  if (filters.region) return 1
  return 0
}

const NATIONAL: Slice = { subs: SUBMISSIONS, cats: CATERERS }

export function DrillDrawer({ indicator, base, filters, onClose }: Props) {
  const [path, setPath] = useState<Step[]>([])
  const start = startIndex(filters)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const slice = useMemo(() => applyPath(base, path), [base, path])
  const agg = indicator.aggregate(slice)
  const levelIndex = start + path.length
  const dim: Dimension | null = levelIndex < DRILL_ORDER.length ? DRILL_ORDER[levelIndex] : null
  const pct = indicator.unit === 'percent'

  const colorFor = (v: number) => (pct ? statusVar(v) : '--s1')

  const groups: BarDatum[] = useMemo(() => {
    if (!dim) return []
    return breakdown(indicator, slice, dim).map((g) => ({
      key: g.key,
      label: g.label,
      value: g.agg.value,
      display: g.agg.display,
      colorVar: colorFor(g.agg.value),
      fail: pct && isFail(g.agg.value),
      tip: `<b>${g.label}</b><br>${indicator.label}: ${g.agg.display}<br>${g.visits} visit${g.visits === 1 ? '' : 's'}`,
    }))
  }, [indicator, slice, dim, pct])

  // Worst schools inside the current scope — the "where do I send someone" list.
  const worst = useMemo(() => {
    if (distinctSchools(slice.subs).length < 2) return []
    return breakdown(indicator, slice, 'school_name')
      .slice()
      .sort((a, b) => a.agg.value - b.agg.value)
      .slice(0, 3)
  }, [indicator, slice])

  // National comparison + rank of the current region.
  const national = indicator.aggregate(NATIONAL)
  const regionStep = path.find((p) => p.dim === 'Region') ?? (filters.region ? { key: filters.region } : null)
  const rank = useMemo(() => {
    if (!regionStep) return null
    const all = breakdown(indicator, NATIONAL, 'Region')
    const i = all.findIndex((g) => g.key === regionStep.key)
    return i < 0 ? null : { pos: i + 1, of: all.length }
  }, [indicator, regionStep])

  const scopeName =
    path.length > 0
      ? path[path.length - 1].label
      : filters.district || (filters.region ? shortRegion(filters.region) : 'All regions')

  const drillInto = (key: string) => {
    const g = breakdown(indicator, slice, dim!).find((x) => x.key === key)
    if (g && dim) setPath([...path, { dim, key, label: g.label }])
  }

  const visits = [...slice.subs].sort((a, b) => (a.record_date < b.record_date ? 1 : -1)).slice(0, 12)

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${indicator.label} breakdown`}>
        <div className="kente-rule" />

        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="crumb">
              <button onClick={() => setPath([])} disabled={path.length === 0}>
                {indicator.label}
              </button>
              {path.map((step, i) => (
                <span key={step.key}>
                  <span className="sep">/</span>
                  <button onClick={() => setPath(path.slice(0, i + 1))} disabled={i === path.length - 1}>
                    {step.label}
                  </button>
                </span>
              ))}
            </div>
            <div className="drawer-hero">
              <span className="big" style={{ color: pct ? `var(${statusVar(agg.value)})` : 'var(--ink)' }}>
                {agg.display}
              </span>
              <span className="ctx">
                {agg.caption ?? `across ${slice.subs.length} visits`}
                <br />
                national {national.display}
                {rank && ` · rank ${rank.pos}/${rank.of}`}
              </span>
            </div>
          </div>
          <button className="ghost-btn" onClick={onClose} aria-label="Close" style={{ color: 'var(--ink-2)' }}>
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {indicator.composition && (
            <>
              <div className="kick">{indicator.composition.title}</div>
              <Donut
                data={indicator.composition.data}
                center={{ value: String(indicator.composition.data.reduce((a, d) => a + d.value, 0)), label: 'total' }}
                unit=""
              />
            </>
          )}

          {dim ? (
            <>
              <div className={`kick${indicator.composition ? ' mt' : ''}`}>
                By {dimLabel(dim)} · click to descend
              </div>
              <BarList
                data={groups}
                max={pct ? 100 : undefined}
                labelWidth={118}
                valueWidth={30}
                onSelect={drillInto}
                emptyLabel="No records here"
              />
            </>
          ) : (
            <div className="kick">{scopeName}</div>
          )}

          {worst.length > 0 && dim !== 'school_name' && (
            <>
              <div className="kick mt">Worst schools in {scopeName}</div>
              {worst.map((w) => (
                <div className="led" key={w.key}>
                  <span className="led-lab" style={{ width: 'auto', flex: 1, fontWeight: 600 }} title={w.label}>
                    {w.label}
                  </span>
                  <span
                    className="led-val tnum"
                    style={{
                      width: 'auto',
                      color: pct ? `var(${statusVar(w.agg.value)})` : 'var(--ink)',
                      fontWeight: 700,
                    }}
                  >
                    {w.agg.display}
                  </span>
                </div>
              ))}
            </>
          )}

          <div className="kick mt">Underlying visits</div>
          {visits.map((s) => (
            <div
              className="led"
              key={s._id}
              style={{ fontSize: 12, color: 'var(--ink-2)', justifyContent: 'space-between' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong style={{ color: 'var(--ink)' }} className="tnum">
                  {s.record_date}
                </strong>{' '}
                · {s.Monitor_Name} · {s.school_name}
              </span>
              <span className="tnum" style={{ flex: 'none' }}>
                {n(s.total_no).toLocaleString()} pupils
              </span>
            </div>
          ))}
          {slice.subs.length > visits.length && (
            <div className="tbl-foot">+ {slice.subs.length - visits.length} more visits in this scope</div>
          )}
        </div>
      </aside>
    </>
  )
}
