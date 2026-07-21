import { useMemo, useState } from 'react'
import type { Slice, Filters } from '../data/types'
import { shortRegion } from '../data/dataset'
import { Section } from './Section'
import {
  buildPaymentRows,
  summarise,
  groupTotals,
  toCSV,
  downloadCSV,
  money,
  TERM_ORDER,
  type PaymentOptions,
} from '../lib/payments'

interface Props {
  /** Geography-filtered, all terms — the engine picks the verifying visit itself. */
  sliceGeo: Slice
  filters: Filters
}

const RATE_KEY = 'gsfp-rate'
const MAX_ROWS = 200
const COLS = '1fr 1.3fr 1.9fr 1.2fr 0.7fr 0.7fr 1fr 0.9fr'

export function PaymentsView({ sliceGeo, filters }: Props) {
  const [term, setTerm] = useState<string>(TERM_ORDER[TERM_ORDER.length - 1])
  const [rate, setRate] = useState<number>(() => Number(localStorage.getItem(RATE_KEY)) || 1.2)
  const [capAtHeadTeacher, setCap] = useState(false)
  const [groupDim, setGroupDim] = useState<'region' | 'district'>('region')

  const opts: PaymentOptions = { term, rate, capAtHeadTeacher }
  const rows = useMemo(() => buildPaymentRows(sliceGeo, opts), [sliceGeo, term, rate, capAtHeadTeacher])
  const totals = useMemo(() => summarise(rows), [rows])
  const groups = useMemo(() => groupTotals(rows, groupDim), [rows, groupDim])

  const scope = filters.district || (filters.region ? shortRegion(filters.region) : 'All regions')
  const setRatePersist = (v: number) => {
    setRate(v)
    localStorage.setItem(RATE_KEY, String(v))
  }
  const exportCSV = () =>
    downloadCSV(`gsfp-caterer-payments-${term.replace(/\s+/g, '-').toLowerCase()}-${scope.replace(/\s+/g, '-').toLowerCase()}.csv`, toCSV(rows, opts))

  return (
    <>
      {/* ---------- basis of payment ---------- */}
      <Section
        id="pay-basis"
        num="P1"
        title="Basis of payment"
        note="pupils fed × cooking days × rate · figures verified by field monitoring"
        right={
          <button className="ghost-btn" onClick={exportCSV} disabled={!rows.length}>
            Export CSV ↓
          </button>
        }
      >
        <div className="pay-controls">
          <div className="pay-field">
            <label htmlFor="pay-term">Payment period</label>
            <select id="pay-term" value={term} onChange={(e) => setTerm(e.target.value)}>
              {TERM_ORDER.map((t) => (
                <option key={t} value={t}>
                  {t} 2025/26
                </option>
              ))}
            </select>
          </div>
          <div className="pay-field">
            <label htmlFor="pay-rate">Rate · GH₵ per child per day</label>
            <input
              id="pay-rate"
              type="number"
              step="0.01"
              min="0"
              value={rate}
              onChange={(e) => setRatePersist(Number(e.target.value))}
            />
          </div>
          <label className="pay-check">
            <input type="checkbox" checked={capAtHeadTeacher} onChange={(e) => setCap(e.target.checked)} />
            Cap enrolment at head teacher's figure
          </label>
          <span className="pay-scope">
            Scope: <strong>{scope}</strong>
          </span>
        </div>

        <div className="rate-warn">
          ⚠ The rate above is a <strong>placeholder</strong>. Set the GSFP-approved rate for this period before the
          schedule is used for disbursement.
        </div>

        <div className="pay-totals">
          <div className="pt">
            <span className="pt-k">Caterers payable</span>
            <span className="pt-v tnum">{totals.caterers.toLocaleString()}</span>
          </div>
          <div className="pt">
            <span className="pt-k">Pupils fed</span>
            <span className="pt-v tnum">{totals.pupils.toLocaleString()}</span>
          </div>
          <div className="pt">
            <span className="pt-k">Cooking days</span>
            <span className="pt-v tnum">{totals.days.toLocaleString()}</span>
          </div>
          <div className="pt grand">
            <span className="pt-k">Total payable</span>
            <span className="pt-v tnum">GH₵ {money(totals.amount)}</span>
          </div>
        </div>

        {(totals.partial > 0 || totals.uncertified > 0) && (
          <div className="note-line">
            {totals.partial > 0 && (
              <>
                <strong>{totals.partial.toLocaleString()}</strong> of {totals.caterers.toLocaleString()} caterers were
                last verified before the term closed — their cooking days may be understated.{' '}
              </>
            )}
            {totals.uncertified > 0 && (
              <>
                {totals.uncertified.toLocaleString()} have no health certificate sighted (flagged, not withheld).
              </>
            )}
          </div>
        )}
      </Section>

      {/* ---------- disbursement summary ---------- */}
      <Section
        id="pay-summary"
        num="P2"
        title="Disbursement summary"
        note="roll-up for payment batches"
        right={
          <button className="ghost-btn" onClick={() => setGroupDim(groupDim === 'region' ? 'district' : 'region')}>
            By {groupDim === 'region' ? 'district' : 'region'} ⇄
          </button>
        }
      >
        <div className="tbl">
          <div className="trow head" style={{ gridTemplateColumns: '2fr 0.8fr 0.9fr 1.1fr', minWidth: 520 }}>
            <span>{groupDim === 'region' ? 'Region' : 'District'}</span>
            <span className="r">Caterers</span>
            <span className="r">Pupils</span>
            <span className="r">Amount (GH₵)</span>
          </div>
          <div className="tbl-scroll-y" style={{ maxHeight: 300 }}>
            {groups.map((g) => (
              <div className="trow" key={g.key} style={{ gridTemplateColumns: '2fr 0.8fr 0.9fr 1.1fr', minWidth: 520 }}>
                <span className="nm">{g.label}</span>
                <span className="r tnum">{g.caterers.toLocaleString()}</span>
                <span className="r tnum">{g.pupils.toLocaleString()}</span>
                <span className="r tnum" style={{ fontWeight: 700 }}>
                  {money(g.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="trow total" style={{ gridTemplateColumns: '2fr 0.8fr 0.9fr 1.1fr', minWidth: 520 }}>
            <span>TOTAL · {groups.length} {groupDim === 'region' ? 'regions' : 'districts'}</span>
            <span className="r tnum">{totals.caterers.toLocaleString()}</span>
            <span className="r tnum">{totals.pupils.toLocaleString()}</span>
            <span className="r tnum">{money(totals.amount)}</span>
          </div>
        </div>
      </Section>

      {/* ---------- payment schedule ---------- */}
      <Section
        id="pay-schedule"
        num="P3"
        title="Payment schedule"
        note={`one row per caterer · ${term} 2025/26 · amounts in GH₵`}
      >
        <div className="tbl">
          <div className="tbl-scroll">
            <div className="trow head" style={{ gridTemplateColumns: COLS, minWidth: 1080 }}>
              <span>District</span>
              <span>School · EMIS</span>
              <span>Caterer · phone</span>
              <span className="r">Pupils fed</span>
              <span className="r">Days</span>
              <span className="r">Rate</span>
              <span className="r">Amount</span>
              <span>Verified</span>
            </div>
            <div className="tbl-scroll-y" style={{ maxHeight: 560 }}>
              {rows.slice(0, MAX_ROWS).map((r) => (
                <div className="trow" key={r.key} style={{ gridTemplateColumns: COLS, minWidth: 1080 }}>
                  <span title={`${r.district}, ${shortRegion(r.region)}`}>{r.district}</span>
                  <span className="nm" title={`${r.school} · EMIS ${r.emis}`}>
                    {r.school}
                    <span className="sub-cell tnum"> {r.emis}</span>
                  </span>
                  <span className="nm" title={r.caterer}>
                    {r.caterer}
                    <span className="sub-cell tnum"> {r.phone}</span>
                  </span>
                  <span className="r tnum">
                    {r.pupils.toLocaleString()}
                    {r.capped && <span className="cap-flag" title={`Declared ${r.declaredPupils}, capped at head teacher's ${r.headTeacherTotal}`}> ▾</span>}
                  </span>
                  <span className="r tnum">{r.days}</span>
                  <span className="r tnum">{rate.toFixed(2)}</span>
                  <span className="r tnum amt">{money(r.amount)}</span>
                  <span className="tnum verif">
                    {r.verifiedOn}
                    {r.partial && <span className="flag review" title="Verified before term close — days may be understated"> ■ PART</span>}
                    {!r.certified && <span className="flag verify" title="No health certificate sighted"> ■ CERT</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="trow total" style={{ gridTemplateColumns: COLS, minWidth: 1080 }}>
            <span>TOTAL</span>
            <span>{totals.caterers.toLocaleString()} caterers</span>
            <span />
            <span className="r tnum">{totals.pupils.toLocaleString()}</span>
            <span className="r tnum">{totals.days.toLocaleString()}</span>
            <span />
            <span className="r tnum">{money(totals.amount)}</span>
            <span />
          </div>
          <div className="tbl-foot">
            {rows.length > MAX_ROWS
              ? `Showing the first ${MAX_ROWS} of ${rows.length.toLocaleString()} caterers — export the CSV for the full schedule. Totals above cover all ${rows.length.toLocaleString()}.`
              : `${rows.length.toLocaleString()} caterers · scroll within table`}
          </div>
        </div>
      </Section>
    </>
  )
}
