import type { Submission, Caterer, Slice } from '../data/types'
import { n } from './format'

/* ============================================================
   Caterer payment engine
   Payable = pupils fed × cooking days (NCD) × rate per child per day
   ============================================================ */

export const TERM_ORDER = ['1st Term', '2nd Term', '3rd Term']

/** Official end of each term — used to tell a complete term from a partial one. */
const TERM_END: Record<string, string> = {
  '1st Term': '2025-12-19',
  '2nd Term': '2026-04-02',
  '3rd Term': '2026-07-13',
}

const NCD_FIELD: Record<string, keyof Caterer> = {
  '1st Term': 'ncd_1st_term',
  '2nd Term': 'ncd_2nd_term',
  '3rd Term': 'ncd_3rd_term',
}

export interface PaymentOptions {
  /** The term being paid for. */
  term: string
  /** GH₵ per child per feeding day. */
  rate: number
  /** Cap payable enrolment at the head teacher's confirmed total. */
  capAtHeadTeacher: boolean
}

export interface PaymentRow {
  key: string
  region: string
  district: string
  school: string
  emis: string
  caterer: string
  phone: string
  /** Enrolment actually used to compute the payment. */
  pupils: number
  declaredPupils: number
  headTeacherTotal: number
  capped: boolean
  days: number
  amount: number
  /** Date of the visit that verified these figures. */
  verifiedOn: string
  monitor: string
  submissionId: string
  /** Health certificate sighted by the monitor. */
  certified: boolean
  /** Verified before the term closed — cooking days may be understated. */
  partial: boolean
}

export interface PaymentTotals {
  caterers: number
  pupils: number
  days: number
  amount: number
  partial: number
  uncertified: number
}

export interface GroupTotal {
  key: string
  label: string
  caterers: number
  pupils: number
  amount: number
}

/**
 * One payable row per caterer for the selected term.
 *
 * Selection rule: a monitoring visit reports the current term's cooking days
 * as-at the visit date, and any earlier term in full. So for term T we consider
 * every visit from term T onwards that carries a figure for T, and take the
 * LATEST one — which yields the most complete verified figure available.
 *
 * `slice` must be filtered by geography only (all terms), not by term.
 */
export function buildPaymentRows(slice: Slice, opts: PaymentOptions): PaymentRow[] {
  const field = NCD_FIELD[opts.term]
  if (!field) return []
  const targetIdx = TERM_ORDER.indexOf(opts.term)
  const subById = new Map<string, Submission>(slice.subs.map((s) => [s._id, s]))

  // Keep the latest qualifying record per caterer.
  const best = new Map<string, Caterer>()
  for (const c of slice.cats) {
    const visitIdx = TERM_ORDER.indexOf(c.term)
    if (visitIdx < targetIdx) continue // visit predates the term being paid
    const days = n(c[field])
    if (days <= 0) continue // no figure reported for this term
    const key = `${c.district}|${c.school_name}|${c.caterer_name}`
    const prev = best.get(key)
    if (!prev || c.record_date > prev.record_date) best.set(key, c)
  }

  const termEnd = TERM_END[opts.term] ?? ''
  const rows: PaymentRow[] = []
  for (const [key, c] of best) {
    const sub = subById.get(c._id)
    const declared = n(c.enrollment)
    const headTotal = sub ? n(sub.total_no) : 0
    const capped = opts.capAtHeadTeacher && headTotal > 0 && declared > headTotal
    const pupils = capped ? headTotal : declared
    const days = n(c[field])
    rows.push({
      key,
      region: c.Region,
      district: c.district,
      school: c.school_name,
      emis: sub?.emis_code ?? '',
      caterer: c.caterer_name,
      phone: c.phone,
      pupils,
      declaredPupils: declared,
      headTeacherTotal: headTotal,
      capped,
      days,
      amount: pupils * days * opts.rate,
      verifiedOn: c.record_date,
      monitor: sub?.Monitor_Name ?? '',
      submissionId: c._id,
      certified: c.cert_inspected === 'seen',
      partial: !!termEnd && c.record_date < termEnd,
    })
  }

  return rows.sort(
    (a, b) =>
      a.region.localeCompare(b.region) ||
      a.district.localeCompare(b.district) ||
      a.school.localeCompare(b.school) ||
      a.caterer.localeCompare(b.caterer),
  )
}

export function summarise(rows: PaymentRow[]): PaymentTotals {
  return rows.reduce<PaymentTotals>(
    (t, r) => ({
      caterers: t.caterers + 1,
      pupils: t.pupils + r.pupils,
      days: t.days + r.days,
      amount: t.amount + r.amount,
      partial: t.partial + (r.partial ? 1 : 0),
      uncertified: t.uncertified + (r.certified ? 0 : 1),
    }),
    { caterers: 0, pupils: 0, days: 0, amount: 0, partial: 0, uncertified: 0 },
  )
}

/** Roll up for disbursement batches. */
export function groupTotals(rows: PaymentRow[], dim: 'region' | 'district'): GroupTotal[] {
  const map = new Map<string, GroupTotal>()
  for (const r of rows) {
    const label = dim === 'region' ? r.region.replace(/ REGION$/, '') : r.district
    const g = map.get(label) ?? { key: label, label, caterers: 0, pupils: 0, amount: 0 }
    g.caterers += 1
    g.pupils += r.pupils
    g.amount += r.amount
    map.set(label, g)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

/* ---------- formatting & export ---------- */

export const money = (v: number): string =>
  v.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const moneyShort = (v: number): string => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}m`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return v.toFixed(0)
}

const csvCell = (v: string | number): string => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Payment schedule as CSV for the accounts team. */
export function toCSV(rows: PaymentRow[], opts: PaymentOptions): string {
  const header = [
    'Region', 'District', 'School', 'EMIS code', 'Caterer', 'Phone',
    'Pupils fed', 'Cooking days', 'Rate (GHS)', 'Amount (GHS)',
    'Declared enrolment', 'Head teacher enrolment', 'Capped',
    'Verified as at', 'Complete term', 'Certificate sighted', 'Monitor', 'Submission ID',
  ]
  const lines = rows.map((r) =>
    [
      r.region, r.district, r.school, r.emis, r.caterer, r.phone,
      r.pupils, r.days, opts.rate.toFixed(2), r.amount.toFixed(2),
      r.declaredPupils, r.headTeacherTotal, r.capped ? 'YES' : '',
      r.verifiedOn, r.partial ? 'NO' : 'YES', r.certified ? 'YES' : 'NO',
      r.monitor, r.submissionId,
    ]
      .map(csvCell)
      .join(','),
  )
  const t = summarise(rows)
  const totalLine = ['TOTAL', '', '', '', `${t.caterers} caterers`, '', t.pupils, t.days, '', t.amount.toFixed(2)]
    .map(csvCell)
    .join(',')
  return [header.join(','), ...lines, '', totalLine].join('\r\n')
}

export function downloadCSV(filename: string, csv: string) {
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
