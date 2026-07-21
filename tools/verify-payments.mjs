// verify-payments.mjs — cross-foots the payment engine against the bundled data.
// Bundles the REAL src/lib/payments.ts with esbuild and asserts invariants, so
// this checks the shipped code rather than a re-implementation.
//   node tools/verify-payments.mjs [rate]

import * as esbuild from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RATE = Number(process.argv[2] ?? 1.2)

const entry = `
  import { buildPaymentRows, summarise, groupTotals, toCSV, TERM_ORDER } from './src/lib/payments'
  import subs from './src/data/submissions.json'
  import cats from './src/data/caterers.json'
  export { buildPaymentRows, summarise, groupTotals, toCSV, TERM_ORDER, subs, cats }
`

const built = await esbuild.build({
  stdin: { contents: entry, resolveDir: root, loader: 'ts' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const mod = await import(
  'data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64')
)

const slice = { subs: mod.subs, cats: mod.cats }
let failures = 0
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}
const near = (a, b) => Math.abs(a - b) < 0.005

for (const term of mod.TERM_ORDER) {
  const opts = { term, rate: RATE, capAtHeadTeacher: false }
  const rows = mod.buildPaymentRows(slice, opts)
  const t = mod.summarise(rows)
  console.log(`\n${term} @ GH¢${RATE.toFixed(2)}/child/day`)
  console.log(
    `  ${t.caterers} caterers · ${t.pupils.toLocaleString()} pupils · ${t.days.toLocaleString()} days · GH¢ ${t.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`,
  )

  if (!rows.length) {
    check('rows produced', false, 'none')
    continue
  }

  // 1. one row per caterer (no duplicates)
  const keys = new Set(rows.map((r) => r.key))
  check('one row per caterer', keys.size === rows.length, `${rows.length} rows / ${keys.size} unique`)

  // 2. per-row arithmetic: pupils × days × rate === amount
  const badMath = rows.filter((r) => !near(r.pupils * r.days * RATE, r.amount))
  check('row arithmetic (pupils × days × rate)', badMath.length === 0, `${badMath.length} mismatched`)

  // 3. cross-foot: rows === region roll-up === district roll-up
  const byRegion = mod.groupTotals(rows, 'region').reduce((a, g) => a + g.amount, 0)
  const byDistrict = mod.groupTotals(rows, 'district').reduce((a, g) => a + g.amount, 0)
  check('cross-foot rows vs region roll-up', near(t.amount, byRegion), `${t.amount.toFixed(2)} vs ${byRegion.toFixed(2)}`)
  check('cross-foot rows vs district roll-up', near(t.amount, byDistrict), `${t.amount.toFixed(2)} vs ${byDistrict.toFixed(2)}`)

  // 4. caterer counts also cross-foot
  const catRegion = mod.groupTotals(rows, 'region').reduce((a, g) => a + g.caterers, 0)
  check('cross-foot caterer counts', catRegion === t.caterers, `${catRegion} vs ${t.caterers}`)

  // 5. sanity: no negative/zero days or pupils, days within a plausible term
  const badDays = rows.filter((r) => r.days <= 0 || r.days > 70)
  const badPupils = rows.filter((r) => r.pupils <= 0)
  check('cooking days within 1–70', badDays.length === 0, `${badDays.length} outside`)
  check('pupils positive', badPupils.length === 0, `${badPupils.length} non-positive`)

  // 6. only visits at or after the paid term were used as the source
  const idx = mod.TERM_ORDER.indexOf(term)
  const catByKey = new Map()
  for (const c of mod.cats) catByKey.set(`${c.district}|${c.school_name}|${c.caterer_name}|${c._id}`, c)
  const badSource = rows.filter((r) => {
    const c = catByKey.get(`${r.district}|${r.school}|${r.caterer}|${r.submissionId}`)
    return !c || mod.TERM_ORDER.indexOf(c.term) < idx
  })
  check('source visit is at/after the paid term', badSource.length === 0, `${badSource.length} bad`)

  // 7. CSV: one line per row + header + blank + total
  const csv = mod.toCSV(rows, opts)
  const lines = csv.split('\r\n')
  check('CSV line count', lines.length === rows.length + 3, `${lines.length} vs ${rows.length + 3}`)
  check('CSV total matches', lines[lines.length - 1].includes(t.amount.toFixed(2)))
}

// 8. head-teacher cap only ever reduces the payable figure
const capped = mod.buildPaymentRows(slice, { term: '3rd Term', rate: RATE, capAtHeadTeacher: true })
const uncapped = mod.buildPaymentRows(slice, { term: '3rd Term', rate: RATE, capAtHeadTeacher: false })
const capTotal = mod.summarise(capped).amount
const unTotal = mod.summarise(uncapped).amount
console.log('\nHead-teacher cap')
check('cap never increases the total', capTotal <= unTotal + 0.005, `capped ${capTotal.toFixed(2)} ≤ uncapped ${unTotal.toFixed(2)}`)
check('cap flags set where reduced', capped.filter((r) => r.capped).every((r) => r.pupils <= r.declaredPupils))

// 9. worked example — recompute one row by hand
const sample = uncapped[0]
console.log('\nWorked example')
console.log(`  ${sample.caterer} · ${sample.school}, ${sample.district}`)
console.log(`  ${sample.pupils} pupils × ${sample.days} days × ${RATE.toFixed(2)} = GH¢ ${(sample.pupils * sample.days * RATE).toFixed(2)}`)
console.log(`  engine says: GH¢ ${sample.amount.toFixed(2)}  (verified ${sample.verifiedOn}${sample.partial ? ', partial term' : ''})`)
check('worked example matches', near(sample.pupils * sample.days * RATE, sample.amount))

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
