import type { Slice } from '../../data/types'
import { REGIONS, shortRegion } from '../../data/dataset'
import { n, hasCode } from '../../lib/format'
import { countIndicator, type Indicator } from '../../lib/metrics'
import { Section } from '../Section'
import { Heatmap } from '../charts/Heatmap'
import { BarList, type BarDatum } from '../charts/BarList'
import { StackedBar, type StackDatum } from '../charts/StackedBar'

interface Props {
  slice: Slice
  onDrill: (i: Indicator) => void
  onRegionSelect: (region: string) => void
}

const BUY: [string, string][] = [
  ['local_markets', 'Open market'],
  ['farm_gate', 'Farm gate'],
  ['others', 'Other'],
]
const ORDER = ['--s1', '--s3', '--s2']

export function NutritionSection({ slice, onDrill, onRegionSelect }: Props) {
  const { subs } = slice

  const localBars: BarDatum[] = REGIONS.filter((r) => subs.some((s) => s.Region === r))
    .map((r) => {
      const list = subs.filter((s) => s.Region === r)
      const v = Math.round(list.reduce((a, s) => a + n(s.What_percentage_of_f_are_locally_produced), 0) / list.length)
      return {
        key: r,
        label: shortRegion(r),
        value: v,
        display: String(v),
        colorVar: '--brand',
        tip: `<b>${shortRegion(r)}</b><br>avg ${v}% locally produced · ${list.length} visits · click to filter`,
      }
    })
    .sort((a, b) => b.value - a.value)

  const buy: StackDatum[] = BUY.map(([code, label], i) => ({
    key: code,
    label,
    value: subs.filter((s) => hasCode(s.Where_do_you_buy_your_foodstuf, code)).length,
    colorVar: ORDER[i],
  })).filter((d) => d.value > 0)

  const drillBuy = (key: string) => {
    const label = BUY.find(([c]) => c === key)![1]
    onDrill(
      countIndicator(
        `buy_${key}`,
        `Buys at: ${label}`,
        `Visits reporting purchases from "${label}".`,
        (s) => hasCode(s.Where_do_you_buy_your_foodstuf, key),
        { title: 'Purchase sources', unit: `${buy.reduce((a, d) => a + d.value, 0)} mentions`, data: buy },
      ),
    )
  }

  return (
    <Section id="nutrition" num="06" title="Nutrition" note="protein service by weekday · visits reporting each source">
      <div className="nutri-grid">
        <div>
          <Heatmap subs={subs} />
          <div className="note-line">
            Protein mix is read from the caterer's weekday menu; a blank day counts as no protein recorded.
          </div>
        </div>
        <div>
          <div className="sub-h">
            Local sourcing by region <span className="lite">· % foodstuffs produced locally</span>
          </div>
          <BarList data={localBars} max={100} labelWidth={100} valueWidth={30} onSelect={onRegionSelect} />
          <div className="sub-h" style={{ margin: '14px 0 6px' }}>
            Purchase sources
          </div>
          <StackedBar title="" unit="" data={buy} onSelect={drillBuy} small />
        </div>
      </div>
    </Section>
  )
}
