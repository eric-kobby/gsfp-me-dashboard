import type { Slice } from '../../data/types'
import { REGIONS, TERMS, shortRegion } from '../../data/dataset'
import { n, seqVar } from '../../lib/format'
import { Section } from '../Section'
import { GhanaMap } from '../charts/GhanaMap'
import { VBars } from '../charts/VBars'
import { BarList, type BarDatum } from '../charts/BarList'

interface Props {
  slice: Slice
  onRegionSelect: (region: string) => void
}

export function CoverageSection({ slice, onRegionSelect }: Props) {
  const { subs } = slice

  // Visits by region — ranked, stepped through the sequential ramp; the weakest is flagged.
  const counts = REGIONS.map((r) => ({ key: r, label: shortRegion(r), value: subs.filter((s) => s.Region === r).length }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
  const maxVisits = Math.max(1, ...counts.map((c) => c.value))
  const regionBars: BarDatum[] = counts.map((c, i) => ({
    ...c,
    display: c.value.toLocaleString('en-US'),
    colorVar: seqVar(c.value, maxVisits),
    fail: i === counts.length - 1 && counts.length > 2,
    tip: `<b>${c.label}</b><br>${c.value} visits · click to filter`,
  }))

  const termBars = TERMS.map((t) => ({
    label: t.replace(' Term', ''),
    value: subs.filter((s) => s.term === t).length,
    tip: `<b>${t}</b><br>${subs.filter((s) => s.term === t).length} visits`,
  }))

  const avg = (key: 'rCorVF_001' | 'rCorVF' | 'natSecVF') =>
    subs.length ? subs.reduce((a, s) => a + n(s[key]), 0) / subs.length : 0
  const freqBars: BarDatum[] = [
    { key: 'zonal', label: 'Zonal', v: avg('rCorVF_001') },
    { key: 'regional', label: 'Regional', v: avg('rCorVF') },
    { key: 'national', label: 'National', v: avg('natSecVF') },
  ].map((r) => ({
    key: r.key,
    label: r.label,
    value: r.v,
    display: r.v.toFixed(1),
    colorVar: '--s3',
    tip: `<b>${r.label} coordinator</b><br>avg ${r.v.toFixed(1)} visits this year`,
  }))

  return (
    <Section
      id="coverage"
      num="02"
      title="Coverage"
      note="map sets the region filter · fill ∝ visits · dots sized by enrolment"
    >
      <div className="cover-grid">
        <div>
          <GhanaMap subs={subs} onSelect={onRegionSelect} />
        </div>
        <div>
          <div className="sub-h">
            Visits by region <span className="lite">· click to filter</span>
          </div>
          <BarList data={regionBars} labelWidth={120} onSelect={onRegionSelect} emptyLabel="No visits in scope" />
          <div className="two-col" style={{ paddingTop: 18 }}>
            <div>
              <div className="sub-h">Visits by term</div>
              <VBars data={termBars} />
            </div>
            <div>
              <div className="sub-h">External monitoring</div>
              <div className="unit" style={{ fontSize: 11.5, marginBottom: 6 }}>
                avg visits reported this year (max 4)
              </div>
              <BarList data={freqBars} max={4} labelWidth={74} valueWidth={32} />
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
