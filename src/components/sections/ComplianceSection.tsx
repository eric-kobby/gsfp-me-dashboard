import type { Slice, Submission } from '../../data/types'
import { n, pct, fmtPct, statusVar, isFail, seqVar } from '../../lib/format'
import { rateIndicator, type Indicator } from '../../lib/metrics'
import { Section } from '../Section'
import { BarList, type BarDatum } from '../charts/BarList'

type Pred = (s: Submission) => boolean

const ROWS: { id: string; label: string; pred: Pred; denom?: Pred }[] = [
  { id: 'records_have', label: 'Daily records form available', pred: (s) => s.Do_you_have_the_daily_records_ === 'yes' },
  {
    id: 'records_use',
    label: 'Daily records in use',
    pred: (s) => s.if_YES_are_they_in_use === 'yes',
    denom: (s) => s.Do_you_have_the_daily_records_ === 'yes',
  },
  { id: 'menu_have', label: 'Regional/district menu available', pred: (s) => s.accordingMenu === 'yes' },
  {
    id: 'menu_follow',
    label: 'Menu followed',
    pred: (s) => s.if_YES_is_it_being_followed === 'yes',
    denom: (s) => s.accordingMenu === 'yes',
  },
  { id: 'premises', label: 'Meal cooked on premises', pred: (s) => s.meal_prepared_on_premises === 'yes' },
  {
    id: 'kitchen',
    label: 'Standard kitchen (where on-site)',
    pred: (s) => s.What_type_of_kitchen_is_availa === 'standard_kitchen',
    denom: (s) => s.meal_prepared_on_premises === 'yes',
  },
  { id: 'nhis', label: 'Pupils enrolled on NHIS', pred: (s) => s.Have_you_received_a_nsurance_NHIS_card === 'yes' },
]

export function ComplianceSection({ slice, onDrill }: { slice: Slice; onDrill: (i: Indicator) => void }) {
  const { subs, cats } = slice

  const bars: BarDatum[] = ROWS.map(({ id, label, pred, denom }) => {
    const den = denom ? subs.filter(denom) : subs
    const num = den.filter(pred).length
    const p = pct(num, den.length) ?? 0
    return {
      key: id,
      label,
      value: p,
      display: String(p),
      colorVar: statusVar(p),
      fail: isFail(p),
      tip: `<b>${label}</b><br>${num} of ${den.length} (${fmtPct(p)})`,
    }
  })

  const drill = (key: string) => {
    const row = ROWS.find((r) => r.id === key)!
    onDrill(rateIndicator(row.id, row.label, `Share of visits where: ${row.label.toLowerCase()}.`, row.pred, row.denom))
  }

  // Certification funnel — cumulative stages, stepping down the sequential ramp.
  const N = cats.length
  const stages = [
    { label: 'Health screening done', v: cats.filter((c) => c.health_screened === 'yes').length },
    { label: 'Certificate obtained', v: cats.filter((c) => c.cert_obtained === 'yes').length },
    { label: 'Certificate sighted by monitor', v: cats.filter((c) => c.cert_inspected === 'seen').length },
  ]
  const cooksTot = cats.reduce((a, c) => a + n(c.total_cooks), 0)
  const cooksOk = cats.reduce((a, c) => a + n(c.cooks_with_valid_cert), 0)
  const funnel = [
    ...stages.map((s) => ({ label: s.label, p: pct(s.v, N) ?? 0, cap: `${s.v} of ${N} caterers` })),
    { label: 'Cooks holding a valid certificate', p: pct(cooksOk, cooksTot) ?? 0, cap: `${cooksOk} of ${cooksTot} cooks` },
  ]
  const top = funnel[0]?.p || 1
  const drop = funnel.length ? funnel[0].p - funnel[funnel.length - 1].p : 0

  return (
    <Section
      id="compliance"
      num="05"
      title="Compliance"
      note="≥75 green · 50–74 amber · <50 red · click any bar to decompose"
    >
      <div className="two-col">
        <div>
          <div className="sub-h">Operational compliance</div>
          <BarList data={bars} max={100} labelWidth={178} valueWidth={32} onSelect={drill} />
        </div>
        <div>
          <div className="sub-h">Caterer health-certification funnel</div>
          {funnel.map((f, i) => {
            const last = i === funnel.length - 1
            const fail = isFail(f.p)
            return (
              <div className={`funnel-row${last && fail ? ' fail' : ''}`} key={f.label}>
                <div className="fr-head">
                  <span style={last && fail ? undefined : { color: 'var(--ink)' }}>{f.label}</span>
                  <span className="tnum" style={{ fontWeight: 700 }}>
                    {fmtPct(f.p)}
                  </span>
                </div>
                <div
                  className="fr-bar"
                  style={{
                    width: `${Math.max(6, (100 * f.p) / Math.max(top, 1))}%`,
                    background: `var(${seqVar(f.p, Math.max(top, 1))})`,
                  }}
                  title={f.cap}
                />
              </div>
            )
          })}
          <div className="note-line" style={{ padding: '6px 0 0' }}>
            {Math.round(drop)}-pt drop from screening to certified cooks; stages are cumulative.
          </div>
        </div>
      </div>
    </Section>
  )
}
