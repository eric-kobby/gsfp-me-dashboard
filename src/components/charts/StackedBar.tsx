import { tipProps } from '../../lib/tooltip'

export interface StackDatum {
  key: string
  label: string
  value: number
  colorVar: string
}

interface Props {
  title: string
  unit: string
  data: StackDatum[]
  onSelect?: (key: string) => void
  small?: boolean
}

// Categorical order for stacked segments, per the design spec.
export const STACK_ORDER = ['--s1', '--s3', '--s2', '--s4', '--s5', '--s6']

/** A 100%-stacked ledger bar — the on-page replacement for donuts/pies. */
export function StackedBar({ title, unit, data, onSelect, small }: Props) {
  const items = data.filter((d) => d.value > 0)
  const total = items.reduce((a, d) => a + d.value, 0)
  if (!total) return <div className="empty">No data</div>

  return (
    <div>
      {(title || unit) && (
        <div className="stack-head">
          <span className="lab">{title}</span>
          <span className="unit">{unit}</span>
        </div>
      )}
      <div className={`stack${small ? ' sm' : ''}`}>
        {items.map((d, i) => {
          const pct = Math.round((100 * d.value) / total)
          const gold = d.colorVar === '--s2' || d.colorVar === '--kente-gold'
          const last = i === items.length - 1
          // Segments under 10% show the value only — the label would be clipped.
          const text = pct >= 16 ? `${d.label} ${pct}%` : pct >= 8 ? `${pct}%` : ''
          const cls = `seg${onSelect ? ' click' : ''}${gold ? ' on-gold' : ''}`
          const style = {
            width: last ? undefined : `${pct}%`,
            flex: last ? 1 : undefined,
            background: `var(${d.colorVar})`,
          }
          const tip = tipProps(`<b>${d.label}</b><br>${d.value} · ${pct}%`)
          return onSelect ? (
            <button key={d.key} className={cls} style={style} onClick={() => onSelect(d.key)} {...tip}>
              {text}
            </button>
          ) : (
            <span key={d.key} className={cls} style={style} {...tip}>
              {text}
            </span>
          )
        })}
      </div>
    </div>
  )
}
