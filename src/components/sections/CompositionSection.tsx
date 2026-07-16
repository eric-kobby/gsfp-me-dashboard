import type { Slice, Submission } from '../../data/types'
import { hasCode } from '../../lib/format'
import { countIndicator, type Indicator, type CompositionPayload } from '../../lib/metrics'
import { Section } from '../Section'
import { StackedBar, type StackDatum } from '../charts/StackedBar'

interface Props {
  slice: Slice
  onDrill: (i: Indicator) => void
}

type Spec = { code: string; label: string }

// Segments follow the categorical order --s1, --s3, --s2, --s4, --s5 per the spec.
const ORDER = ['--s1', '--s3', '--s2', '--s4', '--s5', '--s6']

const KITCHEN: Spec[] = [
  { code: 'standard_kitchen', label: 'Standard kitchen' },
  { code: 'shed', label: 'Shed' },
  { code: 'under_tree', label: 'Under tree' },
]
const WATER: Spec[] = [
  { code: 'borehole', label: 'Borehole' },
  { code: 'pipe_borne_1', label: 'Pipe-borne' },
  { code: 'well', label: 'Well' },
  { code: 'stream', label: 'Stream / river' },
  { code: 'harvested_rain_1', label: 'Harvested rain' },
]
const DAYS: Spec[] = [
  { code: 'five', label: '5 days' },
  { code: 'four', label: '4 days' },
  { code: 'three', label: '3 days' },
  { code: 'two', label: '2 days' },
  { code: 'one', label: '1 day' },
  { code: 'zero', label: 'None' },
]
const EASE: Spec[] = [
  { code: 'very_easy', label: 'Very easy' },
  { code: 'easy', label: 'Easy' },
  { code: 'somehow_easy', label: 'Somehow easy' },
  { code: 'difficult', label: 'Difficult' },
  { code: 'very_difficult', label: 'Very difficult' },
]

export function CompositionSection({ slice, onDrill }: Props) {
  const { subs } = slice

  const single = (specs: Spec[], field: keyof Submission): StackDatum[] =>
    specs
      .map((sp, i) => ({
        key: sp.code,
        label: sp.label,
        value: subs.filter((s) => s[field] === sp.code).length,
        colorVar: ORDER[i % ORDER.length],
      }))
      .filter((d) => d.value > 0)

  const multi = (specs: Spec[], field: keyof Submission): StackDatum[] =>
    specs
      .map((sp, i) => ({
        key: sp.code,
        label: sp.label,
        value: subs.filter((s) => hasCode(s[field], sp.code)).length,
        colorVar: ORDER[i % ORDER.length],
      }))
      .filter((d) => d.value > 0)

  const kitchen = single(KITCHEN, 'What_type_of_kitchen_is_availa')
  const water = multi(WATER, 'What_is_the_source_of_water_fo')
  const days = single(DAYS, 'How_many_days_do_you_cook_in_a_week')
  const ease = single(EASE, 'How_easy_is_the_use_ng_and_serving_meals')

  const sum = (d: StackDatum[]) => d.reduce((a, x) => a + x.value, 0)

  // Composition drills carry their donut into the drawer.
  const payload = (title: string, unit: string, data: StackDatum[]): CompositionPayload => ({ title, unit, data })

  const drillSingle =
    (field: keyof Submission, specs: Spec[], noun: string, data: StackDatum[], title: string, unit: string) =>
    (key: string) => {
      const label = specs.find((s) => s.code === key)!.label
      onDrill(
        countIndicator(
          `${String(field)}_${key}`,
          `${noun}: ${label}`,
          `Visits where ${noun.toLowerCase()} is "${label}".`,
          (s) => s[field] === key,
          payload(title, unit, data),
        ),
      )
    }
  const drillWater = (key: string) => {
    const label = WATER.find((s) => s.code === key)!.label
    onDrill(
      countIndicator(
        `water_${key}`,
        `Water: ${label}`,
        `Visits using "${label}" as a water source.`,
        (s) => hasCode(s.What_is_the_source_of_water_fo, key),
        payload('Water sources', `${sum(water)} mentions`, water),
      ),
    )
  }

  return (
    <Section
      id="composition"
      num="04"
      title="Composition"
      note="100%-stacked ledger bars · click a segment to decompose · donut kept in the drill drawer"
    >
      <div className="two-col" style={{ gap: '16px 26px', paddingTop: 14 }}>
        <StackedBar
          title="Kitchen facilities"
          unit={`n=${sum(kitchen)}`}
          data={kitchen}
          onSelect={drillSingle(
            'What_type_of_kitchen_is_availa',
            KITCHEN,
            'Kitchen',
            kitchen,
            'Kitchen facilities',
            `n=${sum(kitchen)}`,
          )}
        />
        <StackedBar title="Water sources" unit={`n=${sum(water)} mentions`} data={water} onSelect={drillWater} />
        <StackedBar
          title="Cooking days per week"
          unit={`n=${sum(days)}`}
          data={days}
          onSelect={drillSingle(
            'How_many_days_do_you_cook_in_a_week',
            DAYS,
            'Cooking days',
            days,
            'Cooking days per week',
            `n=${sum(days)}`,
          )}
        />
        <StackedBar
          title="Handy-Measures ease of use"
          unit={`n=${sum(ease)} caterers`}
          data={ease}
          onSelect={drillSingle(
            'How_easy_is_the_use_ng_and_serving_meals',
            EASE,
            'Handy Measures',
            ease,
            'Handy-Measures ease of use',
            `n=${sum(ease)} caterers`,
          )}
        />
      </div>
    </Section>
  )
}
