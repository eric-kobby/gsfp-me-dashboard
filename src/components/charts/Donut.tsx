import { tipProps } from '../../lib/tooltip'

export interface DonutDatum {
  key: string
  label: string
  value: number
  colorVar: string
}

interface Props {
  data: DonutDatum[]
  /** true → pie (no hole); false/omitted → donut. */
  pie?: boolean
  center?: { value: string; label: string }
  onSelect?: (key: string) => void
  unit?: string
}

const CX = 50
const CY = 50
const R_OUT = 46
const R_IN = 29

function arcPath(a0: number, a1: number, rOut: number, rIn: number): string {
  const p = (r: number, a: number) => [CX + r * Math.cos(a), CY + r * Math.sin(a)]
  const large = a1 - a0 > Math.PI ? 1 : 0
  const [x0, y0] = p(rOut, a0)
  const [x1, y1] = p(rOut, a1)
  if (rIn > 0) {
    const [x2, y2] = p(rIn, a1)
    const [x3, y3] = p(rIn, a0)
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${rOut} ${rOut} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} A${rIn} ${rIn} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`
  }
  return `M${CX} ${CY} L${x0.toFixed(2)} ${y0.toFixed(2)} A${rOut} ${rOut} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
}

export function Donut({ data, pie, center, onSelect, unit = '' }: Props) {
  const items = data.filter((d) => d.value > 0)
  const total = items.reduce((a, d) => a + d.value, 0)
  const rIn = pie ? 0 : R_IN

  let angle = -Math.PI / 2
  const segs = items.map((d) => {
    const frac = Math.min(0.99999, d.value / total)
    const a0 = angle
    const a1 = angle + frac * 2 * Math.PI
    angle = a1
    const pctNum = Math.round((100 * d.value) / total)
    return { ...d, a0, a1, pct: pctNum }
  })

  return (
    <div className="donut-wrap">
      <div className="donut-fig" style={{ width: 128, height: 128 }}>
        <svg viewBox="0 0 100 100" role="img" aria-label="composition chart">
          {total === 0 ? (
            <circle cx={CX} cy={CY} r={(R_OUT + rIn) / 2} fill="none" stroke="var(--border)" strokeWidth={R_OUT - rIn} />
          ) : (
            segs.map((s) => (
              <path
                key={s.key}
                className={`donut-seg${onSelect ? ' clickable' : ''}`}
                d={arcPath(s.a0, s.a1, R_OUT, rIn)}
                fill={`var(${s.colorVar})`}
                stroke="var(--surface)"
                strokeWidth="1.4"
                onClick={onSelect ? () => onSelect(s.key) : undefined}
                {...tipProps(`<b>${s.label}</b><br>${s.value}${unit} · ${s.pct}%`)}
              />
            ))
          )}
        </svg>
        {!pie && center && (
          <div className="donut-center">
            <span className="dc-val">{center.value}</span>
            <span className="dc-lab">{center.label}</span>
          </div>
        )}
      </div>
      <ul className="donut-legend">
        {segs.map((s) => (
          <li
            key={s.key}
            className={onSelect ? 'clickable' : undefined}
            onClick={onSelect ? () => onSelect(s.key) : undefined}
            {...tipProps(`<b>${s.label}</b><br>${s.value}${unit} · ${s.pct}%`)}
          >
            <i style={{ background: `var(${s.colorVar})` }} />
            <span className="ll">{s.label}</span>
            <span className="lv">{s.value}</span>
            <span className="lp">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
