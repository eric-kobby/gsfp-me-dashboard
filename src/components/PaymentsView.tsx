import { useMemo, useState } from 'react'
import type { Slice, Filters } from '../data/types'
import { REGIONS, districtsIn, shortRegion } from '../data/dataset'
import { Section } from './Section'
import {
  buildPaymentRows,
  summarise,
  groupTotals,
  groupRows,
  toCSV,
  downloadCSV,
  money,
  TERM_ORDER,
  type PaymentOptions,
  type GroupDim,
  type PaymentRow,
} from '../lib/payments'

interface Props {
  /** Geography-filtered, all terms — the engine picks the verifying visit itself. */
  sliceGeo: Slice
  filters: Filters
  onFilterChange: (next: Filters) => void
}

const RATE_KEY = 'gsfp-rate'
const ROWS_PER_GROUP = 40
const FLAT_MAX = 150
const COLS = '1.25fr 1.9fr 1.2fr 0.7fr 0.55fr 0.6fr 1fr 0.95fr'

export function PaymentsView({ sliceGeo, filters, onFilterChange }: Props) {
  const [term, setTerm] = useState<string>(TERM_ORDER[TERM_ORDER.length - 1])
  const [rate, setRate] = useState<number>(() => Number(localStorage.getItem(RATE_KEY)) || 1.2)
  const [capAtHeadTeacher, setCap] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupDim>('region')
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const opts: PaymentOptions = { term, rate, capAtHeadTeacher }
  const rows = useMemo(() => buildPaymentRows(sliceGeo, opts), [sliceGeo, term, rate, capAtHeadTeacher])
  const totals = useMemo(() => summarise(rows), [rows])
  const summaryDim = groupBy === 'district' ? 'district' : 'region'
  const summary = useMemo(() => groupTotals(rows, summaryDim), [rows, summaryDim])
  const groups = useMemo(() => (groupBy === 'none' ? [] : groupRows(rows, groupBy)), [rows, groupBy])

  // With many groups, start collapsed so the subtotals read first.
  const defaultOpen = groups.length <= 3
  const isOpen = (k: string) => open[k] ?? defaultOpen

  const scope = filters.district || (filters.region ? shortRegion(filters.region) : 'All regions')
  const districts = districtsIn(filters.region)

  const setRatePersist = (v: number) => {
    setRate(v)
    localStorage.setItem(RATE_KEY, String(v))
  }
  const exportCSV = () =>
    downloadCSV(
      `gsfp-caterer-payments-${term.replace(/\s+/g, '-').toLowerCase()}-${scope.replace(/[\s/]+/g, '-').toLowerCase()}.csv`,
      toCSV(rows, opts),
    )

  return (
    <>
      {/* ---------- P1 basis of payment ---------- */}
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
            <label htmlFor="pay-region">Region</label>
            <select
              id="pay-region"
              value={filters.region}
              onChange={(e) => onFilterChange({ ...filters, region: e.target.value, district: '' })}
            >
              <option value="">All regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {shortRegion(r)}
                </option>
              ))}
            </select>
          </div>
          <div className="pay-field">
            <label htmlFor="pay-district">District</label>
            <select
              id="pay-district"
              value={filters.district}
              onChange={(e) => onFilterChange({ ...filters, district: e.target.value })}
            >
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="pay-field">
            <label htmlFor="pay-group">Group by</label>
            <select id="pay-group" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupDim)}>
              <option value="region">Region</option>
              <option value="district">District</option>
              <option value="none">No grouping</option>
            </select>
          </div>
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
            <label htmlFor="pay-rate">Rate · GH₵ / child / day</label>
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
          {(filters.region || filters.district) && (
            <button className="reset-btn" onClick={() => onFilterChange({ ...filters, region: '', district: '' })}>
              Clear filter
            </button>
          )}
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
            <span className="pt-k">Total payable · {scope}</span>
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
              <>{totals.uncertified.toLocaleString()} have no health certificate sighted (flagged, not withheld).</>
            )}
          </div>
        )}
      </Section>

      {/* ---------- P2 disbursement summary ---------- */}
      <Section
        id="pay-summary"
        num="P2"
        title="Disbursement summary"
        note={`roll-up by ${summaryDim} for payment batches · click a row to filter`}
      >
        <div className="tbl">
          <div className="trow head" style={{ gridTemplateColumns: '2fr 0.8fr 0.9fr 1.1fr', minWidth: 520 }}>
            <span>{summaryDim === 'region' ? 'Region' : 'District'}</span>
            <span className="r">Caterers</span>
            <span className="r">Pupils</span>
            <span className="r">Amount (GH₵)</span>
          </div>
          <div className="tbl-scroll-y" style={{ maxHeight: 320 }}>
            {summary.map((g) => (
              <button
                className="trow click"
                key={g.key}
                style={{ gridTemplateColumns: '2fr 0.8fr 0.9fr 1.1fr', minWidth: 520 }}
                onClick={() =>
                  summaryDim === 'region'
                    ? onFilterChange({ ...filters, region: `${g.label} REGION`, district: '' })
                    : onFilterChange({ ...filters, district: g.label })
                }
              >
                <span className="nm">{g.label}</span>
                <span className="r tnum">{g.caterers.toLocaleString()}</span>
                <span className="r tnum">{g.pupils.toLocaleString()}</span>
                <span className="r tnum" style={{ fontWeight: 700 }}>
                  {money(g.amount)}
                </span>
              </button>
            ))}
          </div>
          <div className="trow total" style={{ gridTemplateColumns: '2fr 0.8fr 0.9fr 1.1fr', minWidth: 520 }}>
            <span>
              TOTAL · {summary.length} {summaryDim === 'region' ? 'regions' : 'districts'}
            </span>
            <span className="r tnum">{totals.caterers.toLocaleString()}</span>
            <span className="r tnum">{totals.pupils.toLocaleString()}</span>
            <span className="r tnum">{money(totals.amount)}</span>
          </div>
        </div>
      </Section>

      {/* ---------- P3 payment schedule ---------- */}
      <Section
        id="pay-schedule"
        num="P3"
        title="Payment schedule"
        note={`one row per caterer · ${term} 2025/26 · amounts in GH₵${groupBy !== 'none' ? ` · grouped by ${groupBy}` : ''}`}
        right={
          groupBy !== 'none' && groups.length > 1 ? (
            <button
              className="ghost-btn"
              onClick={() => {
                const allOpen = groups.every((g) => isOpen(g.key))
                setOpen(Object.fromEntries(groups.map((g) => [g.key, !allOpen])))
              }}
            >
              {groups.every((g) => isOpen(g.key)) ? 'Collapse all ▴' : 'Expand all ▾'}
            </button>
          ) : undefined
        }
      >
        <div className="tbl">
          <div className="tbl-scroll">
            <div className="trow head" style={{ gridTemplateColumns: COLS, minWidth: 1080 }}>
              <span>District</span>
              <span>School · EMIS</span>
              <span>Caterer · phone</span>
              <span className="r">Pupils</span>
              <span className="r">Days</span>
              <span className="r">Rate</span>
              <span className="r">Amount</span>
              <span>Verified</span>
            </div>

            <div className="tbl-scroll-y" style={{ maxHeight: 620 }}>
              {groupBy === 'none'
                ? rows.slice(0, FLAT_MAX).map((r) => <ScheduleRow key={r.key} r={r} rate={rate} />)
                : groups.map((g) => (
                    <div key={g.key}>
                      <button
                        className="trow grp"
                        style={{ gridTemplateColumns: COLS, minWidth: 1080 }}
                        onClick={() => setOpen({ ...open, [g.key]: !isOpen(g.key) })}
                        aria-expanded={isOpen(g.key)}
                      >
                        <span style={{ gridColumn: 'span 3' }}>
                          <span className="grp-caret">{isOpen(g.key) ? '▾' : '▸'}</span>
                          {g.label}
                          <span className="grp-sub"> · {g.totals.caterers.toLocaleString()} caterers</span>
                        </span>
                        <span className="r tnum">{g.totals.pupils.toLocaleString()}</span>
                        <span className="r tnum">{g.totals.days.toLocaleString()}</span>
                        <span />
                        <span className="r tnum amt">{money(g.totals.amount)}</span>
                        <span />
                      </button>
                      {isOpen(g.key) && (
                        <>
                          {g.rows.slice(0, ROWS_PER_GROUP).map((r) => (
                            <ScheduleRow key={r.key} r={r} rate={rate} />
                          ))}
                          {g.rows.length > ROWS_PER_GROUP && (
                            <div className="grp-more">
                              + {(g.rows.length - ROWS_PER_GROUP).toLocaleString()} more in {g.label} — subtotal above
                              covers all {g.rows.length.toLocaleString()}; export CSV for the full list
                            </div>
                          )}
                        </>
                      )}
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
            {groupBy === 'none' && rows.length > FLAT_MAX
              ? `Showing the first ${FLAT_MAX} of ${rows.length.toLocaleString()} caterers — totals cover all of them. Export CSV for the full schedule.`
              : `${rows.length.toLocaleString()} caterers in scope · export CSV for the full schedule`}
          </div>
        </div>
      </Section>
    </>
  )
}

function ScheduleRow({ r, rate }: { r: PaymentRow; rate: number }) {
  return (
    <div className="trow" style={{ gridTemplateColumns: COLS, minWidth: 1080 }}>
      <span title={`${r.district}, ${shortRegion(r.region)}`}>{r.district}</span>
      <span className="nm" title={`${r.school} · EMIS ${r.emis}`}>
        {r.school}
        <span className="sub-cell tnum">{r.emis}</span>
      </span>
      <span className="nm" title={r.caterer}>
        {r.caterer}
        <span className="sub-cell tnum">{r.phone}</span>
      </span>
      <span className="r tnum">
        {r.pupils.toLocaleString()}
        {r.capped && (
          <span className="cap-flag" title={`Declared ${r.declaredPupils}, capped at head teacher's ${r.headTeacherTotal}`}>
            {' '}
            ▾
          </span>
        )}
      </span>
      <span className="r tnum">{r.days}</span>
      <span className="r tnum">{rate.toFixed(2)}</span>
      <span className="r tnum amt">{money(r.amount)}</span>
      <span className="tnum verif">
        {r.verifiedOn}
        {r.partial && (
          <span className="flag review" title="Verified before term close — days may be understated">
            {' '}
            ■ PART
          </span>
        )}
        {!r.certified && (
          <span className="flag verify" title="No health certificate sighted">
            {' '}
            ■ CERT
          </span>
        )}
      </span>
    </div>
  )
}
