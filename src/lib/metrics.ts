import type { Submission, Caterer, Slice, Dimension } from '../data/types'
import { shortRegion } from '../data/dataset'
import { n, pct, fmtPct, fmtInt } from './format'

/** Result of evaluating one indicator over a slice of data. */
export interface Aggregate {
  value: number // numeric basis for bar scaling / sorting
  display: string // formatted headline value
  caption?: string // e.g. "78 of 93 caterers"
  numer?: number
  denom?: number
}

export type Unit = 'percent' | 'count' | 'number'

/** A composition payload carried by drills that came from a stacked bar — the
    drawer renders the original donut for these (the page uses ledger bars). */
export interface CompositionPayload {
  title: string
  unit: string
  data: { key: string; label: string; value: number; colorVar: string }[]
}

export interface Indicator {
  id: string
  label: string
  description: string
  unit: Unit
  higherIsBetter: boolean
  /** Compute the indicator over any slice — powers both the KPI tile and every drill level. */
  aggregate: (slice: Slice) => Aggregate
  composition?: CompositionPayload
}

/* ---------- helpers ---------- */

const schoolKey = (s: Submission) => `${s.school_name}|${s.district}`

/** One (latest) submission per distinct school in the slice. */
export function distinctSchools(subs: Submission[]): Submission[] {
  const byKey = new Map<string, Submission>()
  for (const s of subs) {
    const k = schoolKey(s)
    const prev = byKey.get(k)
    if (!prev || s.record_date > prev.record_date) byKey.set(k, s)
  }
  return [...byKey.values()]
}

const rate = (numer: number, denom: number, caption?: string): Aggregate => ({
  value: pct(numer, denom) ?? 0,
  display: fmtPct(pct(numer, denom)),
  caption,
  numer,
  denom,
})

/* ---------- indicator catalogue ---------- */

export const INDICATORS: Indicator[] = [
  {
    id: 'visits',
    label: 'Monitoring visits',
    description: 'Total monitoring visits recorded in the current selection.',
    unit: 'count',
    higherIsBetter: true,
    aggregate: ({ subs }) => ({ value: subs.length, display: fmtInt(subs.length), caption: 'visits logged' }),
  },
  {
    id: 'schools',
    label: 'Schools covered',
    description: 'Distinct schools reached by at least one monitoring visit.',
    unit: 'count',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      const schools = distinctSchools(subs).length
      const districts = new Set(subs.map((s) => s.district)).size
      return { value: schools, display: fmtInt(schools), caption: `${districts} district${districts === 1 ? '' : 's'}` }
    },
  },
  {
    id: 'pupils',
    label: 'Pupils enrolled',
    description: 'Total enrolment across covered schools (latest figure per school).',
    unit: 'number',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      const schools = distinctSchools(subs)
      const total = schools.reduce((a, s) => a + n(s.total_no), 0)
      const girls = schools.reduce((a, s) => a + n(s.No_girls), 0)
      return { value: total, display: fmtInt(total), caption: total ? `${Math.round((100 * girls) / total)}% girls` : '' }
    },
  },
  {
    id: 'screened',
    label: 'Caterers health-screened',
    description: 'Share of caterers who have undergone the mandatory health screening.',
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ cats }) => {
      const yes = cats.filter((c) => c.health_screened === 'yes').length
      return rate(yes, cats.length, `${yes} of ${cats.length} caterers`)
    },
  },
  {
    id: 'cooksCert',
    label: 'Cooks with valid certificate',
    description: 'Cooks holding a valid health certificate, across all caterers.',
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ cats }) => {
      const total = cats.reduce((a, c) => a + n(c.total_cooks), 0)
      const ok = cats.reduce((a, c) => a + n(c.cooks_with_valid_cert), 0)
      return rate(ok, total, `${ok} of ${total} cooks`)
    },
  },
  {
    id: 'menu',
    label: 'Menu followed',
    description: 'Where a regional/district menu exists, the share of schools following it.',
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      const have = subs.filter((s) => s.accordingMenu === 'yes')
      const follow = have.filter((s) => s.if_YES_is_it_being_followed === 'yes').length
      return rate(follow, have.length, `${follow} of ${have.length} with a menu`)
    },
  },
  {
    id: 'records',
    label: 'Daily records in use',
    description: 'Where a daily records form exists, the share of schools actively using it.',
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      const have = subs.filter((s) => s.Do_you_have_the_daily_records_ === 'yes')
      const inUse = have.filter((s) => s.if_YES_are_they_in_use === 'yes').length
      return rate(inUse, have.length, `${inUse} of ${have.length} with a form`)
    },
  },
  {
    id: 'premises',
    label: 'Cooked on premises',
    description: 'Share of visits where the meal is prepared on the school premises.',
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      const yes = subs.filter((s) => s.meal_prepared_on_premises === 'yes').length
      return rate(yes, subs.length, `${yes} of ${subs.length} visits`)
    },
  },
  {
    id: 'quality',
    label: 'Service quality score',
    description: 'Average share of the 8 kitchen-observation standards met per observed visit.',
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      const items: (keyof Submission)[] = [
        'Apron',
        'Protective_shoes_safety_shoes',
        'Personal_Hygiene_of_caterer_cooks',
        'Meal_served_on_tables',
        'Food_Warmer_for_serving_meals',
        'Caterer_school_owned_feeding_bowls',
        'Food_Quantity_sufficient_per_child',
        'Quality_of_meals_ser_use_your_discretion',
      ]
      const observed = subs.filter((s) => s.Apron !== '')
      const yes = observed.reduce((a, s) => a + items.filter((k) => s[k] === 'yes').length, 0)
      return rate(yes, observed.length * items.length, `${observed.length} observed visits`)
    },
  },
  {
    id: 'localProduce',
    label: 'Locally produced foods',
    description: 'Average share of foodstuffs that caterers purchase from local producers.',
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      if (!subs.length) return { value: 0, display: '—' }
      const avg = subs.reduce((a, s) => a + n(s.What_percentage_of_f_are_locally_produced), 0) / subs.length
      return { value: Math.round(avg), display: `${Math.round(avg)}%`, caption: `avg across ${subs.length} visits` }
    },
  },
  {
    id: 'nhis',
    label: 'Pupils enrolled on NHIS',
    description: 'Share of visits reporting pupils enrolled on the National Health Insurance Scheme.',
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      const yes = subs.filter((s) => s.Have_you_received_a_nsurance_NHIS_card === 'yes').length
      return rate(yes, subs.length, `${yes} of ${subs.length} visits`)
    },
  },
  {
    id: 'mealUptake',
    label: 'Pupils eating the meals',
    description: 'Share of interviewed pupils who report eating the school feeding meals.',
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      const yes = subs.filter((s) => s.Do_you_eat_the_school_meals === 'yes').length
      return rate(yes, subs.length, `${yes} of ${subs.length} pupils`)
    },
  },
]

export const indicatorById = (id: string): Indicator =>
  INDICATORS.find((i) => i.id === id) ?? INDICATORS[0]

/* ---------- ad-hoc indicator factories (for drillable section bars) ---------- */

type SubPredicate = (s: Submission) => boolean

/** A yes/no rate over visits (optionally within a denominator subset). */
export function rateIndicator(
  id: string,
  label: string,
  description: string,
  predicate: SubPredicate,
  denom?: SubPredicate,
): Indicator {
  return {
    id,
    label,
    description,
    unit: 'percent',
    higherIsBetter: true,
    aggregate: ({ subs }) => {
      const d = denom ? subs.filter(denom) : subs
      const num = d.filter(predicate).length
      return rate(num, d.length, `${num} of ${d.length} visits`)
    },
  }
}

/** A count of visits matching a predicate — for categorical (multi-select) bars. */
export function countIndicator(
  id: string,
  label: string,
  description: string,
  predicate: SubPredicate,
  composition?: CompositionPayload,
): Indicator {
  return {
    id,
    label,
    description,
    unit: 'count',
    higherIsBetter: true,
    composition,
    aggregate: ({ subs }) => {
      const num = subs.filter(predicate).length
      return { value: num, display: fmtInt(num), caption: `${num} of ${subs.length} visits` }
    },
  }
}

/* ---------- drill-down ---------- */

export const DRILL_ORDER: Dimension[] = ['Region', 'district', 'school_name']

export const dimLabel = (d: Dimension): string =>
  ({ Region: 'region', district: 'district', school_name: 'school' })[d]

export interface DrillGroup {
  key: string
  label: string
  agg: Aggregate
  visits: number
}

/** Break a slice into groups along one dimension and evaluate the indicator on each. */
export function breakdown(indicator: Indicator, slice: Slice, dim: Dimension): DrillGroup[] {
  const keys = [...new Set(slice.subs.map((s) => s[dim]))].filter(Boolean)
  const catMatch = (c: Caterer, key: string) => (c as unknown as Record<string, string>)[dim] === key

  return keys
    .map((key) => {
      const subs = slice.subs.filter((s) => s[dim] === key)
      const cats = slice.cats.filter((c) => catMatch(c, key))
      return {
        key,
        label: dim === 'Region' ? shortRegion(key) : key,
        agg: indicator.aggregate({ subs, cats }),
        visits: subs.length,
      }
    })
    .sort((a, b) => b.agg.value - a.agg.value || collator.compare(a.label, b.label))
}

const collator = new Intl.Collator()

/** Apply an ordered set of drill selections to narrow a slice. */
export function applyPath(base: Slice, path: { dim: Dimension; key: string }[]): Slice {
  let subs = base.subs
  let cats = base.cats
  for (const { dim, key } of path) {
    subs = subs.filter((s) => s[dim] === key)
    cats = cats.filter((c) => (c as unknown as Record<string, string>)[dim] === key)
  }
  return { subs, cats }
}
