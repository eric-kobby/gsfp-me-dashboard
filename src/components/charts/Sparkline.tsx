interface Props {
  points: (number | null)[]
  colorVar?: string
}

// A compact trend line (term-over-term) for KPI tiles. Auto-scales to its own range.
const VW = 100
const VH = 26

export function Sparkline({ points, colorVar = '--seq4' }: Props) {
  const vals = points.filter((p): p is number => p != null)
  if (vals.length < 2) return <svg viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true" />

  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const n = points.length
  const x = (i: number) => (n === 1 ? VW / 2 : (i / (n - 1)) * VW)
  const y = (v: number) => VH - 2 - ((v - min) / span) * (VH - 5)

  const line: string[] = []
  const area: string[] = []
  let started = false
  let lastX = 0
  let lastY = 0
  points.forEach((v, i) => {
    if (v == null) return
    const px = x(i)
    const py = y(v)
    line.push(`${started ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`)
    area.push(`${started ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`)
    started = true
    lastX = px
    lastY = py
  })
  const firstX = x(points.findIndex((p) => p != null))
  const areaPath = `${area.join(' ')} L${lastX.toFixed(1)} ${VH} L${firstX.toFixed(1)} ${VH} Z`

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={areaPath} fill={`var(${colorVar})`} fillOpacity="0.12" stroke="none" />
      <path d={line.join(' ')} fill="none" stroke={`var(${colorVar})`} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r="2.2" fill={`var(${colorVar})`} stroke="var(--surface)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
