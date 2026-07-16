import type { Slice } from '../../data/types'
import { hasCode, pct } from '../../lib/format'
import { countIndicator, type Indicator } from '../../lib/metrics'
import { Section } from '../Section'
import { BarList, type BarDatum } from '../charts/BarList'

const CHALLENGES: [string, string][] = [
  ['delay_in_payment', 'Delayed caterer payments'],
  ['high_food_prices', 'Food price inflation'],
  ['seasonality_of_the_food_item', 'Seasonality of food items'],
  ['more_pupils_to_be_fed_than_ero', 'More pupils fed than enrolled'],
  ['nonavailability_of_kitchen_in_', 'Kitchen infrastructure'],
  ['feeding_the_teachers', 'Feeding the teachers'],
  ['nonavailability_of_food_item', 'Food item unavailable'],
  ['other', 'Other'],
]

// NOTE: form v21 stores misaligned value/label pairs for this question — labels shown as deployed.
const FUNDING: [string, string][] = [
  ['bank_loan', 'Personal funds'],
  ['credit_purchases', 'Individual loans'],
  ['financiers', 'Credit purchases'],
  ['personal_support', 'Bank loans'],
]

export function ChallengesSection({ slice, onDrill }: { slice: Slice; onDrill: (i: Indicator) => void }) {
  const { subs } = slice
  const nS = subs.length

  const build = (specs: [string, string][], field: 'What_Challenges_do_you_face_as' | 'What_is_your_source_of_Financi'): BarDatum[] =>
    specs
      .map(([code, label]) => ({ key: code, label, count: subs.filter((s) => hasCode(s[field], code)).length }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((r, i) => ({
        key: r.key,
        label: r.label,
        value: pct(r.count, nS) ?? 0,
        display: String(pct(r.count, nS) ?? 0),
        colorVar: '--s4',
        tip: `<b>${r.label}</b><br>${r.count} of ${nS} visits (${pct(r.count, nS)}%)`,
        strong: i === 0,
      }))

  const chal = build(CHALLENGES, 'What_Challenges_do_you_face_as')
  const fund = build(FUNDING, 'What_is_your_source_of_Financi')

  const drill = (specs: [string, string][], field: 'What_Challenges_do_you_face_as' | 'What_is_your_source_of_Financi', noun: string) => (key: string) => {
    const label = specs.find(([c]) => c === key)![1]
    onDrill(
      countIndicator(`${noun}_${key}`, `${noun}: ${label}`, `Visits reporting "${label}".`, (s) => hasCode(s[field], key)),
    )
  }

  const arrears = chal.find((c) => c.key === 'delay_in_payment')

  return (
    <Section id="challenges" num="08" title="Challenges & funding" note="ranked · % of visits reporting">
      <div className="two-col">
        <div>
          <div className="sub-h">Caterer challenges</div>
          <BarList
            data={chal}
            max={100}
            labelWidth={190}
            valueWidth={32}
            onSelect={drill(CHALLENGES, 'What_Challenges_do_you_face_as', 'Challenge')}
          />
        </div>
        <div>
          <div className="sub-h">Source of funding</div>
          <BarList
            data={fund}
            max={100}
            labelWidth={190}
            valueWidth={32}
            onSelect={drill(FUNDING, 'What_is_your_source_of_Financi', 'Funding')}
          />
          <div className="note-line">
            ⚠ Form v21 stores misaligned value/label pairs for the funding question — labels shown as deployed.
          </div>
        </div>
      </div>
      {arrears && (
        <div className="note-line">
          Caterers reporting delayed payments: <strong>{arrears.display}%</strong> of visits — the most-reported
          constraint in this selection.
        </div>
      )}
    </Section>
  )
}
