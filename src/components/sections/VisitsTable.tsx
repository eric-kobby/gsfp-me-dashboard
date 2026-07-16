import { useState } from 'react'
import type { Slice, Submission } from '../../data/types'
import { n, statusVar } from '../../lib/format'
import { Section } from '../Section'

const COLS = '0.9fr 2fr 1.3fr 1.1fr 0.8fr 0.8fr'

const OBS: (keyof Submission)[] = [
  'Apron',
  'Protective_shoes_safety_shoes',
  'Personal_Hygiene_of_caterer_cooks',
  'Meal_served_on_tables',
  'Food_Warmer_for_serving_meals',
  'Caterer_school_owned_feeding_bowls',
  'Food_Quantity_sufficient_per_child',
  'Quality_of_meals_ser_use_your_discretion',
]

/** Observation score out of 5, from the 8-item checklist. */
function score(s: Submission): number | null {
  if (s.Apron === '') return null
  const yes = OBS.filter((k) => s[k] === 'yes').length
  return Math.round((yes / OBS.length) * 5 * 10) / 10
}

const MAX_ROWS = 150

export function VisitsTable({ slice }: { slice: Slice }) {
  const [open, setOpen] = useState(true)
  const rows = [...slice.subs].sort((a, b) => (a.record_date < b.record_date ? 1 : -1))
  const shown = open ? rows.slice(0, MAX_ROWS) : []

  return (
    <Section
      id="visits"
      num="10"
      title="Visits"
      note="full monitoring log · collapsible"
      right={
        <button className="ghost-btn" onClick={() => setOpen(!open)}>
          {open ? 'Collapse ▴' : 'Expand ▾'}
        </button>
      }
    >
      {open && (
        <div className="tbl">
          <div className="tbl-scroll-y">
            <div className="trow head" style={{ gridTemplateColumns: COLS, minWidth: 660 }}>
              <span>Date</span>
              <span>School</span>
              <span>District</span>
              <span>Monitor</span>
              <span className="r">Pupils fed</span>
              <span className="r">Score</span>
            </div>
            {shown.map((s) => {
              const sc = score(s)
              return (
                <div className="trow" key={s._id} style={{ gridTemplateColumns: COLS, minWidth: 660 }}>
                  <span className="tnum">{s.record_date}</span>
                  <span className="nm" title={s.school_name}>
                    {s.school_name}
                  </span>
                  <span title={s.district}>{s.district}</span>
                  <span>{s.Monitor_Name}</span>
                  <span className="r tnum">{n(s.total_no).toLocaleString()}</span>
                  <span
                    className="r tnum"
                    style={{ fontWeight: 700, color: sc == null ? 'var(--ink-2)' : `var(${statusVar(sc * 20)})` }}
                  >
                    {sc == null ? '—' : sc.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="tbl-foot center">
            {rows.length.toLocaleString()} visits in this selection
            {rows.length > MAX_ROWS ? ` · showing the ${MAX_ROWS} most recent · scroll within table` : ' · scroll within table'}
          </div>
        </div>
      )}
    </Section>
  )
}
