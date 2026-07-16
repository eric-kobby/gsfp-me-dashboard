import { useMemo } from 'react'
import type { Submission } from '../../data/types'
import { n, seqVar, seqNeedsLightText } from '../../lib/format'
import { shortRegion } from '../../data/dataset'
import { tipProps } from '../../lib/tooltip'
import regionsGeoRaw from '../../data/ghanaRegions.json'

interface RegionGeo {
  name: string
  key: string
  rings: number[][][]
  c: number[]
}
const REGIONS_GEO = regionsGeoRaw as RegionGeo[]

// Static equirectangular projection fitted to Ghana's bounds.
const W = 360
const allPts = REGIONS_GEO.flatMap((r) => r.rings.flat())
const lons = allPts.map((p) => p[0])
const lats = allPts.map((p) => p[1])
const minLon = Math.min(...lons)
const maxLon = Math.max(...lons)
const minLat = Math.min(...lats)
const maxLat = Math.max(...lats)
const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
const H = Math.round(W / (((maxLon - minLon) * kx) / (maxLat - minLat)))
const px = (lon: number) => ((lon - minLon) / (maxLon - minLon)) * W
const py = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * H
const ringPath = (ring: number[][]) =>
  ring.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p[0]).toFixed(1)} ${py(p[1]).toFixed(1)}`).join(' ') + 'Z'

interface Props {
  subs: Submission[]
  onSelect?: (region: string) => void
}

/** Choropleth: fill ∝ visits through the sequential green ramp; school dots in kente gold. */
export function GhanaMap({ subs, onSelect }: Props) {
  const { schools, stats, maxVisits } = useMemo(() => {
    const bySchool = new Map<string, Submission & { visits: number }>()
    const stats = new Map<string, { visits: number; schools: Set<string> }>()
    for (const s of subs) {
      const k = `${s.school_name}|${s.district}`
      const prev = bySchool.get(k)
      if (prev) prev.visits += 1
      else bySchool.set(k, { ...s, visits: 1 })
      const st = stats.get(s.Region) ?? { visits: 0, schools: new Set<string>() }
      st.visits += 1
      st.schools.add(k)
      stats.set(s.Region, st)
    }
    return {
      schools: [...bySchool.values()],
      stats,
      maxVisits: Math.max(1, ...[...stats.values()].map((v) => v.visits)),
    }
  }, [subs])

  return (
    <>
      <div className="mapwrap">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ghana regions — monitoring coverage">
          {REGIONS_GEO.map((r) => {
            const st = stats.get(r.key)
            const cvar = st ? seqVar(st.visits, maxVisits) : '--seq1'
            return (
              <path
                key={r.key}
                className={`map-region${onSelect && st ? ' click' : ''}`}
                d={r.rings.map(ringPath).join(' ')}
                fill={st ? `var(${cvar})` : 'var(--track)'}
                stroke="var(--rule)"
                strokeWidth="0.7"
                strokeLinejoin="round"
                onClick={onSelect && st ? () => onSelect(r.key) : undefined}
                {...tipProps(
                  st
                    ? `<b>${r.name}</b><br>${st.visits} visit${st.visits === 1 ? '' : 's'} · ${st.schools.size} school${
                        st.schools.size === 1 ? '' : 's'
                      }`
                    : `<b>${r.name}</b><br>no visits`,
                )}
              />
            )
          })}
          {REGIONS_GEO.map((r) => {
            const st = stats.get(r.key)
            const cvar = st ? seqVar(st.visits, maxVisits) : '--seq1'
            const light = st ? seqNeedsLightText(cvar) : false
            return (
              <text
                key={`l-${r.key}`}
                x={px(r.c[0]).toFixed(1)}
                y={py(r.c[1]).toFixed(1)}
                textAnchor="middle"
                fontSize="7"
                fontWeight={st ? 700 : 400}
                fill={light ? 'var(--bg)' : st ? 'var(--ink)' : 'var(--ink-2)'}
                style={{ pointerEvents: 'none' }}
              >
                {r.name}
              </text>
            )
          })}
          {schools.map((v) => (
            <circle
              key={`${v.school_name}|${v.district}`}
              className="mapdot"
              cx={px(n(v.lon)).toFixed(1)}
              cy={py(n(v.lat)).toFixed(1)}
              r={Math.max(2.6, Math.sqrt(n(v.total_no)) / 4.6).toFixed(1)}
              fill="var(--kente-gold)"
              stroke="var(--ink)"
              strokeWidth="0.5"
              onClick={onSelect ? () => onSelect(v.Region) : undefined}
              {...tipProps(
                `<b>${v.school_name}</b><br>${v.district}, ${shortRegion(v.Region)}<br>${n(
                  v.total_no,
                ).toLocaleString()} pupils · ${v.visits} visit${v.visits > 1 ? 's' : ''}`,
              )}
            />
          ))}
        </svg>
      </div>
      <div className="map-key">
        <span>fewer visits</span>
        {['--seq1', '--seq2', '--seq3', '--seq4', '--seq5', '--seq6'].map((c) => (
          <i key={c} style={{ background: `var(${c})` }} />
        ))}
        <span>more</span>
        <span style={{ marginLeft: 'auto' }}>
          <svg width="9" height="9" style={{ verticalAlign: 'middle', marginRight: 4 }}>
            <circle cx="4.5" cy="4.5" r="3.5" fill="var(--kente-gold)" stroke="var(--ink)" strokeWidth="0.5" />
          </svg>
          school · r ∝ enrolment
        </span>
      </div>
    </>
  )
}
