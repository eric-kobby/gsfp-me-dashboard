import type { Submission } from '../../data/types'
import { hasCode, seqVar, seqNeedsLightText } from '../../lib/format'
import { tipProps } from '../../lib/tooltip'

const DAYS: (keyof Submission)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PROTEINS: [string, string][] = [
  ['fish', 'Fish'],
  ['beans', 'Beans'],
  ['eggs', 'Eggs'],
  ['groundnut', 'Groundnut'],
  ['soya_powder', 'Soya powder'],
  ['agushi', 'Agushi'],
  ['fish_powder', 'Fish powder'],
  ['tuna_flakes', 'Tuna flakes'],
  ['chicken', 'Chicken'],
  ['meat', 'Meat'],
]

/** Protein service by weekday. The "no protein" row is always flagged in --crit. */
export function Heatmap({ subs }: { subs: Submission[] }) {
  const rows = PROTEINS.map(([code, label]) => ({
    label,
    fail: false,
    counts: DAYS.map((day) => subs.filter((s) => hasCode(s[day], code)).length),
  }))
    .map((r) => ({ ...r, total: r.counts.reduce((a, b) => a + b, 0) }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)

  // A visit with no protein recorded on that day at all.
  const noProtein = {
    label: 'No protein',
    fail: true,
    counts: DAYS.map((day) => subs.filter((s) => !(s[day] ?? '').trim()).length),
    total: 0,
  }
  const all = noProtein.counts.some((c) => c > 0) ? [...rows, noProtein] : rows

  if (!all.length) return <div className="empty">No menu data</div>
  const max = Math.max(1, ...all.flatMap((r) => r.counts))

  return (
    <div className="heat">
      <span />
      {DAYS.map((d) => (
        <span className="hh" key={d}>
          {d.slice(0, 3)}
        </span>
      ))}
      {all.map((r) => (
        <Row key={r.label} label={r.label} counts={r.counts} max={max} fail={r.fail} days={DAYS} />
      ))}
    </div>
  )
}

function Row({
  label,
  counts,
  max,
  fail,
  days,
}: {
  label: string
  counts: number[]
  max: number
  fail: boolean
  days: (keyof Submission)[]
}) {
  return (
    <>
      <span className="rl" style={fail ? { color: 'var(--crit)', fontWeight: 700 } : undefined} title={label}>
        {label}
      </span>
      {counts.map((v, j) => {
        const cvar = seqVar(v, max)
        const light = seqNeedsLightText(cvar)
        return (
          <span
            key={j}
            className="cell tnum"
            style={{
              background: `var(${cvar})`,
              color: fail ? 'var(--crit)' : light ? 'var(--bg)' : 'var(--ink)',
              fontWeight: fail ? 700 : 600,
            }}
            {...tipProps(`<b>${label}</b> · ${days[j]}<br>${v} visit${v === 1 ? '' : 's'}`)}
          >
            {v}
          </span>
        )
      })}
    </>
  )
}
