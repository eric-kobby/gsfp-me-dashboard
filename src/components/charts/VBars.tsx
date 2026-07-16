import { tipProps } from '../../lib/tooltip'
import { seqVar } from '../../lib/format'

interface Datum {
  label: string
  value: number
  tip?: string
}

/** Vertical term bars — stepped through the sequential ramp, 2px ink baseline. */
export function VBars({ data }: { data: Datum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <>
      <div className="vbars">
        {data.map((d) => (
          <div className="vbar" key={d.label}>
            <span className="vnum tnum">{d.value.toLocaleString('en-US')}</span>
            <div
              className="vfill"
              style={{ height: `${Math.max(2, (76 * d.value) / max)}%`, background: `var(${seqVar(d.value, max)})` }}
              {...tipProps(d.tip ?? `<b>${d.label}</b><br>${d.value}`)}
            />
          </div>
        ))}
      </div>
      <div className="vlabs">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </>
  )
}
