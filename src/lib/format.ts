export const n = (v: string | number | undefined): number => {
  const x = typeof v === 'number' ? v : parseFloat(v ?? '')
  return Number.isFinite(x) ? x : 0
}

export const pct = (numer: number, denom: number): number | null =>
  denom > 0 ? Math.round((100 * numer) / denom) : null

export const fmtPct = (p: number | null): string => (p === null ? '—' : `${p}%`)

export const fmtInt = (v: number): string => v.toLocaleString('en-US')

/** Does a space-separated multi-select answer contain a given code? */
export const hasCode = (answer: string | undefined, code: string): boolean =>
  (answer ?? '').split(' ').includes(code)

export const titleize = (s: string): string => s.replace(/_/g, ' ')

/* Performance thresholds — reserved status colours, never chart series.
   >=75 good · 50-74 amber · <50 crit */
export const statusVar = (p: number): string => (p >= 75 ? '--good' : p >= 50 ? '--amber' : '--crit')
export const isFail = (p: number): boolean => p < 50

/** Step a 0-100 value through the sequential green ramp. */
export const seqVar = (p: number, max = 100): string => {
  const r = max > 0 ? p / max : 0
  if (r >= 0.85) return '--seq6'
  if (r >= 0.65) return '--seq5'
  if (r >= 0.45) return '--seq4'
  if (r >= 0.25) return '--seq3'
  if (r > 0) return '--seq2'
  return '--seq1'
}

/** Ramp steps that need light text on top. */
export const seqNeedsLightText = (v: string): boolean => v === '--seq4' || v === '--seq5' || v === '--seq6'
