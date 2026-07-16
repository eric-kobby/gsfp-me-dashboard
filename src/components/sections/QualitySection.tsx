import type { Slice, Submission } from '../../data/types'
import { n, pct, fmtPct, statusVar, isFail } from '../../lib/format'
import { rateIndicator, type Indicator } from '../../lib/metrics'
import { Section } from '../Section'
import { BarList, type BarDatum } from '../charts/BarList'

type Pred = (s: Submission) => boolean

const OBS_ITEMS: [keyof Submission, string][] = [
  ['Apron', 'Apron worn'],
  ['Protective_shoes_safety_shoes', 'Protective footwear'],
  ['Personal_Hygiene_of_caterer_cooks', 'Personal hygiene good'],
  ['Meal_served_on_tables', 'Meals served on tables'],
  ['Food_Warmer_for_serving_meals', 'Food warmer used'],
  ['Caterer_school_owned_feeding_bowls', 'Feeding bowls available'],
  ['Food_Quantity_sufficient_per_child', 'Quantity sufficient per child'],
  ['Quality_of_meals_ser_use_your_discretion', 'Meal quality acceptable'],
]

export function QualitySection({ slice, onDrill }: { slice: Slice; onDrill: (i: Indicator) => void }) {
  const { subs } = slice
  const nS = subs.length
  const observed = subs.filter((s) => s.Apron !== '')
  const wasObserved: Pred = (s) => s.Apron !== ''

  const bars: BarDatum[] = OBS_ITEMS.map(([k, label]) => {
    const num = observed.filter((s) => s[k] === 'yes').length
    const p = pct(num, observed.length) ?? 0
    return {
      key: k as string,
      label,
      value: p,
      display: String(p),
      colorVar: statusVar(p),
      fail: isFail(p),
      tip: `<b>${label}</b><br>${num} of ${observed.length} observed visits`,
    }
  }).sort((a, b) => b.value - a.value)

  const drill = (key: string) => {
    const item = OBS_ITEMS.find(([k]) => k === key)!
    onDrill(
      rateIndicator(`obs_${key}`, item[1], `Observed kitchens meeting: ${item[1]}.`, (s) => s[item[0]] === 'yes', wasObserved),
    )
  }

  const eat = pct(subs.filter((s) => s.Do_you_eat_the_school_meals === 'yes').length, nS)
  const attend = pct(subs.filter((s) => s.Do_you_come_to_schoo_chool_feeding_meals_ === 'yes').length, nS)
  const otherMeals = nS ? subs.reduce((a, s) => a + n(s.How_many_times_do_yo_chool_feeding_melas_), 0) / nS : 0

  return (
    <Section
      id="quality"
      num="07"
      title="Service quality & pupils"
      note="8-item observation checklist · % of observed visits passing"
    >
      <div className="two-col tight">
        <BarList data={bars.slice(0, 4)} max={100} labelWidth={178} valueWidth={32} onSelect={drill} />
        <BarList data={bars.slice(4)} max={100} labelWidth={178} valueWidth={32} onSelect={drill} />
      </div>
      <div className="inline-stats">
        <span>
          Pupils who eat the meals <strong className="tnum">{fmtPct(eat)}</strong>
        </span>
        <span>
          Attend because of the meals <strong className="tnum">{fmtPct(attend)}</strong>
        </span>
        <span>
          Other meals per day{' '}
          <strong className="tnum" style={{ color: otherMeals < 2 ? 'var(--amber)' : undefined }}>
            {otherMeals.toFixed(1)}
          </strong>
        </span>
      </div>
    </Section>
  )
}
