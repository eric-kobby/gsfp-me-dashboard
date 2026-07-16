import { useState } from 'react'
import { showTip, hideTip } from '../../lib/tooltip'

export interface LineSeries {
  id: string
  label: string
  colorVar: string
  points: (number | null)[]
  /** The declining / watch line is drawn dashed. */
  dashed?: boolean
}

interface Props {
  xLabels: string[]
  series: LineSeries[]
  yMin?: number
  yMax?: number
  unit?: string
}

const W = 760
const H = 250
const X0 = 90
const X1 = 710
const Y_TOP = 30 // yMax
const Y_BASE = 210 // yMin

export function LineChart({ xLabels, series, yMin = 40, yMax = 100, unit = '%' }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const n = xLabels.length
  const x = (i: number) => (n === 1 ? (X0 + X1) / 2 : X0 + (i / (n - 1)) * (X1 - X0))
  const y = (v: number) => Y_BASE - ((v - yMin) / (yMax - yMin)) * (Y_BASE - Y_TOP)
  const ticks = [100, 80, 60, 40].filter((t) => t <= yMax && t >= yMin)

  const onMove = (i: number, cx: number, cy: number) => {
    setActive(i)
    const rows = series
      .filter((s) => s.points[i] != null)
      .map(
        (s) =>
          `<span style="display:inline-block;width:10px;height:3px;background:var(${s.colorVar});margin-right:6px;vertical-align:middle"></span>${s.label}: <b>${s.points[i]}${unit}</b>`,
      )
      .join('<br>')
    showTip(`<b>${xLabels[i]}</b><br>${rows || 'no data'}`, cx, cy)
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', display: 'block' }}
      role="img"
      aria-label="Indicator trends across terms"
      onMouseLeave={() => {
        setActive(null)
        hideTip()
      }}
    >
      {ticks.map((t) => {
        const gy = y(t)
        const base = t === yMin
        return (
          <g key={t}>
            <line
              x1={60}
              y1={gy}
              x2={740}
              y2={gy}
              stroke={base ? 'var(--ink)' : 'var(--grid-line)'}
              strokeWidth={base ? 1.5 : 1}
            />
            <text x={52} y={gy + 4} textAnchor="end" fontSize="11" fill="var(--ink-2)" className="tnum">
              {t}
            </text>
          </g>
        )
      })}

      {active != null && (
        <line
          x1={x(active)}
          y1={Y_TOP}
          x2={x(active)}
          y2={Y_BASE}
          stroke="var(--ink-2)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}

      {series.map((s) => {
        const segs: string[] = []
        let started = false
        s.points.forEach((v, i) => {
          if (v == null) {
            started = false
            return
          }
          segs.push(`${started ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
          started = true
        })
        const lastIdx = s.points.map((v, i) => (v != null ? i : -1)).filter((i) => i >= 0).pop()
        return (
          <g key={s.id}>
            <path
              d={segs.join(' ')}
              fill="none"
              stroke={`var(${s.colorVar})`}
              strokeWidth="2.5"
              strokeDasharray={s.dashed ? '6 4' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {lastIdx != null && (
              <circle cx={x(lastIdx)} cy={y(s.points[lastIdx] as number)} r="4" fill={`var(${s.colorVar})`} />
            )}
          </g>
        )
      })}

      {xLabels.map((lab, i) => (
        <text key={lab} x={x(i)} y={234} textAnchor="middle" fontSize="11.5" fill="var(--ink-2)">
          {lab}
        </text>
      ))}

      {xLabels.map((_, i) => {
        const bw = (X1 - X0) / Math.max(1, n - 1)
        return (
          <rect
            key={i}
            x={x(i) - bw / 2}
            y={Y_TOP}
            width={bw}
            height={Y_BASE - Y_TOP}
            fill="transparent"
            onMouseMove={(e) => onMove(i, e.clientX, e.clientY)}
            onMouseEnter={(e) => onMove(i, e.clientX, e.clientY)}
          />
        )
      })}
    </svg>
  )
}
