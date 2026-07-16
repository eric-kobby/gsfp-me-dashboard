import type { ReactNode } from 'react'

interface Props {
  id: string
  num: string
  title: string
  note?: string
  right?: ReactNode
  children: ReactNode
}

/** A numbered ledger section: `NN · Name` over a 2px ink rule. */
export function Section({ id, num, title, note, right, children }: Props) {
  return (
    <section className="sec" id={id}>
      <div className="sec-head">
        <h2>
          {num} · {title}
        </h2>
        {note && <span className="note">{note}</span>}
        {right && <span className="right">{right}</span>}
      </div>
      {children}
    </section>
  )
}

/** The section register — single source of truth for the rail and the page order. */
export const SECTIONS = [
  { id: 'scorecard', num: '01', name: 'Scorecard' },
  { id: 'coverage', num: '02', name: 'Coverage' },
  { id: 'trends', num: '03', name: 'Trends' },
  { id: 'composition', num: '04', name: 'Composition' },
  { id: 'compliance', num: '05', name: 'Compliance' },
  { id: 'nutrition', num: '06', name: 'Nutrition' },
  { id: 'quality', num: '07', name: 'Quality & pupils' },
  { id: 'challenges', num: '08', name: 'Challenges' },
  { id: 'dataquality', num: '09', name: 'Data quality' },
  { id: 'visits', num: '10', name: 'Visits' },
]
