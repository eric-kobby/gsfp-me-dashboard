import { useEffect, useMemo, useState } from 'react'
import type { Filters, Slice } from './data/types'
import { SUBMISSIONS, CATERERS, LATEST_VISIT_DATE } from './data/dataset'
import { distinctSchools, type Indicator } from './lib/metrics'
import { FilterBar } from './components/Filters'
import { KpiGrid } from './components/KpiGrid'
import { DrillDrawer } from './components/DrillDrawer'
import { Section, SECTIONS } from './components/Section'
import { PaymentsView } from './components/PaymentsView'
import { CoverageSection } from './components/sections/CoverageSection'
import { TrendSection } from './components/sections/TrendSection'
import { CompositionSection } from './components/sections/CompositionSection'
import { ComplianceSection } from './components/sections/ComplianceSection'
import { NutritionSection } from './components/sections/NutritionSection'
import { QualitySection } from './components/sections/QualitySection'
import { ChallengesSection } from './components/sections/ChallengesSection'
import { DataQualitySection } from './components/sections/DataQualitySection'
import { VisitsTable } from './components/sections/VisitsTable'

type Theme = 'light' | 'dark'
type View = 'monitoring' | 'payments'

const PAY_SECTIONS = [
  { id: 'pay-basis', num: 'P1', name: 'Basis of payment' },
  { id: 'pay-summary', num: 'P2', name: 'Disbursement' },
  { id: 'pay-schedule', num: 'P3', name: 'Schedule' },
]

export function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('gsfp-theme') as Theme) || 'light')
  const [filters, setFilters] = useState<Filters>({ region: '', district: '', term: '' })
  const [drill, setDrill] = useState<Indicator | null>(null)
  const [view, setView] = useState<View>('monitoring')
  const [activeSec, setActiveSec] = useState<string>(SECTIONS[0].id)
  const railItems = view === 'monitoring' ? SECTIONS : PAY_SECTIONS

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gsfp-theme', theme)
  }, [theme])

  // Scroll-spy for the section index rail.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSec(visible[0].target.id)
      },
      { rootMargin: '-70px 0px -60% 0px', threshold: 0 },
    )
    railItems.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [railItems])

  const slice: Slice = useMemo(() => {
    const { region, district, term } = filters
    const match = (o: { Region: string; district: string; term: string }) =>
      (!region || o.Region === region) && (!district || o.district === district) && (!term || o.term === term)
    return { subs: SUBMISSIONS.filter(match), cats: CATERERS.filter(match) }
  }, [filters])

  // Geography-only slice (ignores term) so the trend arc always spans all terms.
  const sliceGeo: Slice = useMemo(() => {
    const { region, district } = filters
    const match = (o: { Region: string; district: string }) =>
      (!region || o.Region === region) && (!district || o.district === district)
    return { subs: SUBMISSIONS.filter(match), cats: CATERERS.filter(match) }
  }, [filters])

  const schools = distinctSchools(slice.subs).length
  const selectRegion = (region: string) => setFilters({ region, district: '', term: filters.term })
  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      <div className="kente-rule" />

      <header className="masthead">
        <div className="masthead-bar">
          <div className="lockup">
            <span className="mark">Ghana School Feeding Programme</span>
            <span className="sub">Zonal M&amp;E Ledger</span>
          </div>
          <div className="viewswitch" role="tablist" aria-label="View">
            {(['monitoring', 'payments'] as View[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                className={view === v ? 'on' : undefined}
                onClick={() => {
                  setView(v)
                  setActiveSec(v === 'monitoring' ? SECTIONS[0].id : PAY_SECTIONS[0].id)
                  window.scrollTo(0, 0)
                }}
              >
                {v === 'monitoring' ? 'Monitoring' : 'Caterer payments'}
              </button>
            ))}
          </div>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          />
        </div>
      </header>

      <div className="shell">
        <nav className="rail" aria-label="Sections">
          {railItems.map((s) => (
            <button key={s.id} className={activeSec === s.id ? 'on' : undefined} onClick={() => goTo(s.id)}>
              <span className="rn">{s.num}</span>
              {s.name}
            </button>
          ))}
        </nav>

        <main className="content">
          {view === 'monitoring' ? (
            <>
              <Section
                id="scorecard"
                num="01"
                title="Scorecard"
                note={`${slice.subs.length} visits · ${schools} schools · term-over-term · every tile drills down`}
              >
                <KpiGrid slice={slice} trendSlice={sliceGeo} onDrill={setDrill} />
              </Section>

              <CoverageSection slice={slice} onRegionSelect={selectRegion} />
              <TrendSection slice={sliceGeo} />
              <CompositionSection slice={slice} onDrill={setDrill} />
              <ComplianceSection slice={slice} onDrill={setDrill} />
              <NutritionSection slice={slice} onDrill={setDrill} onRegionSelect={selectRegion} />
              <QualitySection slice={slice} onDrill={setDrill} />
              <ChallengesSection slice={slice} onDrill={setDrill} />
              <DataQualitySection slice={slice} />
              <VisitsTable slice={slice} />
            </>
          ) : (
            <PaymentsView sliceGeo={sliceGeo} filters={filters} onFilterChange={setFilters} />
          )}

          <div className="colophon">
            <span>
              Form: GSFPZCSTool · KoboToolbox · <strong>synthetic demo data</strong> — illustrative figures across all
              16 regions, not official GSFP statistics
            </span>
            <span className="tnum">
              {SUBMISSIONS.length.toLocaleString()} submissions · latest visit {LATEST_VISIT_DATE}
            </span>
          </div>
        </main>
      </div>

      {drill && <DrillDrawer indicator={drill} base={slice} filters={filters} onClose={() => setDrill(null)} />}
    </>
  )
}
