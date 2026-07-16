import type { CSSProperties } from 'react'
import { tipProps } from '../../lib/tooltip'

export interface BarDatum {
  key: string
  label: string
  value: number
  display: string
  colorVar?: string
  tip?: string
  /** Renders label + value in --crit (failing row). */
  fail?: boolean
  /** Emphasises the label (used for the top-ranked row). */
  strong?: boolean
}

interface Props {
  data: BarDatum[]
  /** Bar-scale maximum. Omit to use the largest value in the set. */
  max?: number
  labelWidth?: number
  valueWidth?: number
  onSelect?: (key: string) => void
  emptyLabel?: string
}

/** The core ledger row: label · track · tabular number. */
export function BarList({ data, max, labelWidth = 178, valueWidth, onSelect, emptyLabel = 'No data' }: Props) {
  if (!data.length) return <div className="empty">{emptyLabel}</div>
  const scale = max ?? Math.max(1, ...data.map((d) => d.value))
  const clickable = !!onSelect

  return (
    <div style={{ ['--lab-w' as string]: `${labelWidth}px` } as CSSProperties}>
      {data.map((d) => {
        const w = Math.max(d.value > 0 ? 1 : 0, (100 * d.value) / scale)
        const inner = (
          <>
            <span className="led-lab" title={d.label} style={d.strong ? { fontWeight: 700 } : undefined}>
              {d.label}
            </span>
            <span className="led-track">
              <span className="led-fill" style={{ width: `${w}%`, background: `var(${d.colorVar ?? '--s1'})` }} />
            </span>
            <span className="led-val" style={valueWidth ? { width: valueWidth } : undefined}>
              {d.display}
            </span>
            {clickable && <span className="led-chev">›</span>}
          </>
        )
        const cls = `led${clickable ? ' click' : ''}${d.fail ? ' fail' : ''}`
        const tip = tipProps(d.tip ?? `<b>${d.label}</b><br>${d.display}`)
        return clickable ? (
          <button key={d.key} className={cls} onClick={() => onSelect!(d.key)} {...tip}>
            {inner}
          </button>
        ) : (
          <div key={d.key} className={cls} {...tip}>
            {inner}
          </div>
        )
      })}
    </div>
  )
}
