import type { Slice } from '../../data/types'
import { n } from '../../lib/format'
import { shortRegion } from '../../data/dataset'
import { Section } from '../Section'

const COLS = '2.2fr 1.4fr 0.9fr 0.9fr 0.7fr 0.9fr'

/** Enrolment reconciliation: head-teacher total vs the caterers' combined figure.
    >25% gap → VERIFY · 15-25% → REVIEW. */
export function DataQualitySection({ slice }: { slice: Slice }) {
  const flagged = slice.subs
    .map((s) => {
      const head = n(s.total_no)
      const fed = n(s.total_fed_caterers)
      const gap = fed - head
      const rel = head > 0 ? (100 * gap) / head : 0
      return { s, gap, rel }
    })
    .filter((r) => Math.abs(r.rel) >= 15)
    .sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel))

  const MAX = 30
  const shown = flagged.slice(0, MAX)
  const anyGap = slice.subs.filter((s) => n(s.total_fed_caterers) !== n(s.total_no)).length

  return (
    <Section
      id="dataquality"
      num="09"
      title="Data quality"
      note="enrolment reconciliation — head teacher vs caterers · gap ≥15% flagged"
    >
      <div className="tbl">
        <div className="tbl-scroll">
          <div className="trow head" style={{ gridTemplateColumns: COLS, minWidth: 620 }}>
            <span>School</span>
            <span>District</span>
            <span className="r">Head teacher</span>
            <span className="r">Caterers</span>
            <span className="r">Gap</span>
            <span>Flag</span>
          </div>
          {shown.length ? (
            shown.map(({ s, rel }) => {
              const verify = Math.abs(rel) > 25
              return (
                <div className="trow" key={s._id} style={{ gridTemplateColumns: COLS, minWidth: 620 }}>
                  <span className="nm" title={s.school_name}>
                    {s.school_name}
                  </span>
                  <span title={`${s.district}, ${shortRegion(s.Region)}`}>{s.district}</span>
                  <span className="r tnum">{n(s.total_no).toLocaleString()}</span>
                  <span className="r tnum">{n(s.total_fed_caterers).toLocaleString()}</span>
                  <span
                    className="r tnum"
                    style={{ fontWeight: 700, color: verify ? 'var(--crit)' : 'var(--amber)' }}
                  >
                    {rel > 0 ? '+' : '−'}
                    {Math.abs(Math.round(rel))}%
                  </span>
                  <span className={`flag ${verify ? 'verify' : 'review'}`}>■ {verify ? 'VERIFY' : 'REVIEW'}</span>
                </div>
              )
            })
          ) : (
            <div className="empty">Every visit reconciles within 15%.</div>
          )}
        </div>
        <div className="tbl-foot">
          {flagged.length.toLocaleString()} of {slice.subs.length.toLocaleString()} visits exceed the 15%
          reconciliation threshold{flagged.length > MAX ? ` · showing the ${MAX} largest gaps` : ''} · {anyGap} show any
          gap at all.
        </div>
      </div>
    </Section>
  )
}
