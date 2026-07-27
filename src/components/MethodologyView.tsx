import { Section } from './Section'

/** In-app methodology note — how every dashboard score is calculated.
    Mirrors the shared methodology document, in the dashboard's own language. */
export function MethodologyView() {
  return (
    <div className="mth">
      {/* M0 */}
      <Section
        id="mth-principles"
        num="M0"
        title="Six rules that govern every number"
        note="These hold for all indicators; each section below only adds the specific numerator and denominator."
      >
        <ul className="rules">
          <li>
            <b>The unit of analysis is the monitoring visit</b> — one submitted form, one school, one
            day. A few indicators instead count <em>caterers</em> or <em>cooks</em>; each is named
            explicitly.
          </li>
          <li>
            <b>Every percentage is</b> <code>numerator ÷ denominator × 100</code>, rounded to the
            nearest whole number. 66.5 → 67; 66.4 → 66.
          </li>
          <li>
            <b>Filters narrow the set, then the same formula runs.</b> Choosing a region, district or
            term restricts which visits are counted — numerator and denominator shrink together, so a
            filtered figure is a true rate for that selection, not a slice of a national number.
          </li>
          <li>
            <b>The same formula runs at every level.</b> National, regional, district and per-school
            drill-downs use one calculation, so subtotals always reconcile to totals.
          </li>
          <li>
            <b>Performance colour is fixed:</b>{' '}
            <span className="chips">
              <span className="chip g">≥ 75% good</span>
              <span className="chip a">50–74% fair</span>
              <span className="chip c">&lt; 50% weak</span>
            </span>
          </li>
          <li>
            <b>An empty denominator shows “—”, not 0%.</b> If no school in the selection has a menu,
            “menu followed” has nothing to measure and is shown as not-applicable.
          </li>
        </ul>
      </Section>

      {/* M1 */}
      <Section
        id="mth-scorecard"
        num="M1"
        title="Headline scorecard"
        note="The eight figures at the top of the Monitoring view — three counts, five percentages."
      >
        <div className="mth-table">
          <table>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>What it measures</th>
                <th style={{ width: '32%' }}>Calculation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>Monitoring visits</b>
                  <span className="ic">count</span>
                </td>
                <td>How many monitoring forms were submitted in the selection.</td>
                <td className="calc">number of visits</td>
              </tr>
              <tr>
                <td>
                  <b>Schools covered</b>
                  <span className="ic">count</span>
                </td>
                <td>Distinct schools reached by at least one visit — a school visited three times counts once.</td>
                <td className="calc">distinct schools</td>
              </tr>
              <tr>
                <td>
                  <b>Pupils enrolled</b>
                  <span className="ic">count</span>
                </td>
                <td>Total enrolment across covered schools, using each school’s latest enrolment (boys + girls).</td>
                <td className="calc">Σ latest enrolment</td>
              </tr>
              <tr>
                <td>
                  <b>Caterers health-screened</b>
                  <span className="ic">percent · per caterer</span>
                </td>
                <td>Share of caterers who have undergone the mandatory health screening.</td>
                <td className="calc">screened ÷ all caterers</td>
              </tr>
              <tr>
                <td>
                  <b>Cooks with valid certificate</b>
                  <span className="ic">percent · per cook</span>
                </td>
                <td>Cooks holding a valid health certificate, pooled across every caterer.</td>
                <td className="calc">Σ certified ÷ Σ cooks</td>
              </tr>
              <tr>
                <td>
                  <b>Menu followed</b>
                  <span className="ic">percent · conditional</span>
                </td>
                <td>Among schools that have a menu, the share actually following it.</td>
                <td className="calc">following ÷ have-menu</td>
              </tr>
              <tr>
                <td>
                  <b>Service quality score</b>
                  <span className="ic">percent · composite</span>
                </td>
                <td>Average pass rate across the 8-item observation checklist (see M5).</td>
                <td className="calc">yes ÷ (8 × observed)</td>
              </tr>
              <tr>
                <td>
                  <b>Pupils eating the meals</b>
                  <span className="ic">percent</span>
                </td>
                <td>Share of visits where the interviewed pupil says they eat the meals.</td>
                <td className="calc">eat=yes ÷ all visits</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="eg">
          <span className="tag">Worked example · illustrative</span>
          <p>
            <b>Cooks with valid certificate.</b> Three caterers are monitored, with cooks certified 2
            of 3, 1 of 2, and 3 of 4.
          </p>
          <div className="calc">
            certified = 2 + 1 + 3 = 6
            <br />
            all cooks = 3 + 2 + 4 = 9
            <br />
            score = 6 ÷ 9 × 100 = <span className="res">67%</span>
          </div>
          <p className="fine">
            This pools cooks, not caterers — a caterer with more cooks carries more weight.
            “Caterers health-screened” instead counts each caterer once.
          </p>
        </div>

        <div className="eg">
          <span className="tag">Worked example · illustrative</span>
          <p>
            <b>Menu followed — why the denominator is conditional.</b> A district has 20 monitored
            schools; 16 have a menu; of those 16, twelve follow it.
          </p>
          <div className="calc">
            score = 12 ÷ 16 × 100 = <span className="res">75%</span>
          </div>
          <p className="fine">
            The 4 schools with no menu are excluded — a school cannot “follow” a menu that does not
            exist. “Daily records in use” and “standard kitchen” use the same conditional logic.
          </p>
        </div>

        <p>
          <b>Term change (▲/▼ and sparkline).</b> Each tile compares the selection across the three
          terms. The arrow is the latest term minus the first — in <em>percentage points</em> for a
          percentage indicator (78% → 83% is ▲ 5 pt), or a plain difference for a count.
        </p>
      </Section>

      {/* M2 */}
      <Section
        id="mth-compliance"
        num="M2"
        title="Compliance bars"
        note="Each bar is the share of visits meeting one requirement. Four use a conditional denominator."
      >
        <div className="mth-table">
          <table>
            <thead>
              <tr>
                <th>Bar</th>
                <th>Numerator ÷ denominator</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><b>Daily records form available</b></td><td className="calc">has a form ÷ all visits</td></tr>
              <tr><td><b>Daily records in use</b> <span className="ic">conditional</span></td><td className="calc">in use ÷ visits that have a form</td></tr>
              <tr><td><b>Regional/district menu available</b></td><td className="calc">has a menu ÷ all visits</td></tr>
              <tr><td><b>Menu followed</b> <span className="ic">conditional</span></td><td className="calc">following ÷ visits that have a menu</td></tr>
              <tr><td><b>Meal cooked on premises</b></td><td className="calc">on premises ÷ all visits</td></tr>
              <tr><td><b>Standard kitchen</b> <span className="ic">conditional</span></td><td className="calc">standard kitchen ÷ visits cooking on premises</td></tr>
              <tr><td><b>Pupils enrolled on NHIS</b></td><td className="calc">NHIS=yes ÷ all visits</td></tr>
            </tbody>
          </table>
        </div>
        <h4>Caterer health-certification funnel</h4>
        <div className="formula">
          <b>screened</b>{'  = caterers screened          '}<span className="op">÷ all caterers × 100</span>{'\n'}
          <b>obtained</b>{'  = certificate obtained       '}<span className="op">÷ all caterers × 100</span>{'\n'}
          <b>sighted </b>{'  = certificate seen by monitor '}<span className="op">÷ all caterers × 100</span>{'\n'}
          <b>cooks   </b>{'  = valid-certificate cooks     '}<span className="op">÷ all cooks   × 100</span>
        </div>
        <p className="lead">
          Stages are cumulative — you cannot have a sighted certificate without obtaining one — so the
          bars step down. The gap between first and last stage is the drop-off to close.
        </p>
      </Section>

      {/* M3 */}
      <Section
        id="mth-pupils"
        num="M3"
        title="Pupil experience"
        note="Three figures from the pupil interview at each visit — including “attend because of the meals”, an outcome, not a compliance check."
      >
        <div className="mth-table">
          <table>
            <thead>
              <tr>
                <th>Figure</th>
                <th>Form question</th>
                <th>Calculation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Pupils who eat the meals</b></td>
                <td>“Do you eat the school feeding meals?”</td>
                <td className="calc">yes ÷ all visits</td>
              </tr>
              <tr>
                <td><b>Attend because of the meals</b></td>
                <td>“Do you come to school because of the meals?”</td>
                <td className="calc">yes ÷ all visits</td>
              </tr>
              <tr>
                <td><b>Other meals per day</b> <span className="ic">average</span></td>
                <td>“How many times do you eat aside the feeding meals?”</td>
                <td className="calc">mean of the number</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="callout">
          <span className="h">What “Attend because of the meals” means</span>
          The share of monitored schools where a pupil reports that the feeding programme is a reason
          they come to school — a direct read on the meal as an <b>attendance and enrolment
          incentive</b>. It is not a compliance measure; it measures effect on the child.
          <br />
          <br />
          <b>Other meals per day</b> is an average, not a percentage — the mean number of additional
          daily meals pupils report. A low value is a food-security signal, shown in amber below two.
        </div>
      </Section>

      {/* M4 */}
      <Section
        id="mth-shares"
        num="M4"
        title="Composition & challenges — two kinds of share"
        note="These sections use two different denominators; telling them apart avoids a common misreading."
      >
        <h4>A · Share of responses — stacked bars (sum to 100%)</h4>
        <p>
          Kitchen facilities, water sources, cooking days and Handy-Measures ease are one bar split
          into segments. Each segment is that option ÷ the total of all segments, so the bar fills to
          100%.
        </p>
        <div className="formula">
          segment % = <b>this option</b> <span className="op">÷ total responses × 100</span>
        </div>
        <h4>B · Share of visits — ranked bars (can exceed 100% together)</h4>
        <p>
          Caterer challenges, funding sources, purchase sources and protein-by-weekday are
          multi-select: one visit can report several. Each bar is that option ÷ all visits, so a
          single visit adds to several bars and they need not sum to 100%.
        </p>
        <div className="formula">
          bar % = <b>visits reporting this option</b> <span className="op">÷ all visits × 100</span>
        </div>
        <div className="eg">
          <span className="tag">Worked example · illustrative</span>
          <p>
            <b>Why challenges add up to more than 100%.</b> Of 100 visits, 43 report delayed payments
            and 31 report food-price inflation — many report both.
          </p>
          <div className="calc">
            delayed payments = 43 ÷ 100 = <span className="res">43%</span>
            <br />
            food-price inflation = 31 ÷ 100 = <span className="res">31%</span>
          </div>
          <p className="fine">
            Two independent “how many visits mentioned this” rates — not slices of a pie. That is why
            they are ranked bars, not a stacked bar. <b>Locally produced foods</b> is different again:
            each visit reports a percentage, and the figure shown is the plain average of them.
          </p>
        </div>
      </Section>

      {/* M5 */}
      <Section
        id="mth-quality"
        num="M5"
        title="Service quality score — in full"
        note="The one composite on the dashboard. The monitor completes an 8-item observation checklist per visit, each item yes/no."
      >
        <div className="formula">
          8 items: apron · protective footwear · personal hygiene · meals on tables ·{'\n'}
          food warmer · feeding bowls · quantity sufficient · meal quality{'\n\n'}
          <b>score</b> = total “yes” marks <span className="op">÷ ( 8 × observed visits ) × 100</span>
        </div>
        <div className="eg">
          <span className="tag">Worked example · illustrative</span>
          <p>Five visits have a completed checklist. The “yes” marks on each are 7, 6, 8, 5 and 6.</p>
          <div className="calc">
            yes marks = 7 + 6 + 8 + 5 + 6 = 32
            <br />
            possible = 8 items × 5 visits = 40
            <br />
            score = 32 ÷ 40 × 100 = <span className="res">80%</span>
          </div>
          <p className="fine">
            Equivalently the average of the five per-visit pass rates. Only visits where the checklist
            was completed (an “observed visit”, i.e. a caterer or cook was present) count — others are
            excluded from both sides. The same 8 items also appear individually as the checklist bars.
          </p>
        </div>
      </Section>

      {/* M6 */}
      <Section id="mth-notes" num="M6" title="Notes for the reviewer">
        <ul className="rules">
          <li>
            <b>Rounding is display-only.</b> Ranking, colour banding and drill-downs use the unrounded
            value, so a bar can read “50%” yet sit in the fair band if it is 49.6%.
          </li>
          <li>
            <b>“Observed visits” vs “all visits”.</b> Observation figures use only visits where a
            caterer or cook was present and the checklist was completed; the subset is stated on each
            figure so the denominator is never hidden.
          </li>
          <li>
            <b>Latest-visit rule for stock figures.</b> Standing facts (enrolment, school count) use
            the most recent visit; rates pool every qualifying visit in the selection.
          </li>
          <li>
            <b>Data is taken as clean.</b> These formulas assume the submitted data has already passed
            the programme’s own cleaning and validation; the dashboard reports what was submitted.
          </li>
          <li>
            <b>Traceability.</b> Every figure decomposes to its underlying visits via drill-down, each
            carrying form ID, monitor, date and location.
          </li>
        </ul>
        <p className="lead" style={{ marginTop: 18 }}>
          Worked examples above are illustrative and use round numbers for clarity — they are not
          figures from the dataset.
        </p>
      </Section>
    </div>
  )
}

export const MET_SECTIONS = [
  { id: 'mth-principles', num: 'M0', name: 'Principles' },
  { id: 'mth-scorecard', num: 'M1', name: 'Scorecard' },
  { id: 'mth-compliance', num: 'M2', name: 'Compliance' },
  { id: 'mth-pupils', num: 'M3', name: 'Pupil experience' },
  { id: 'mth-shares', num: 'M4', name: 'Shares of the whole' },
  { id: 'mth-quality', num: 'M5', name: 'Quality score' },
  { id: 'mth-notes', num: 'M6', name: 'Reviewer notes' },
]
