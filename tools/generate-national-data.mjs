// generate-national-data.mjs  (DEMO DATA — synthetic)
// Generates a realistic national GSFP monitoring dataset covering all 16 regions
// and all 261 districts, written directly to the app's bundled JSON:
//   src/data/submissions.json  (one row per school visit)
//   src/data/caterers.json     (one row per caterer)
//
// This bypasses KoboToolbox on purpose: it is demo data for feedback, not a real
// collection. Regenerate with:  node tools/generate-national-data.mjs [seed]
// The real Kobo pipeline (Refresh-KoboData.ps1 + Sync-AppData.ps1) is unchanged.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const geo = JSON.parse(fs.readFileSync(path.join(__dirname, 'geo.json'), 'utf8'))

// ---------- seeded RNG (reproducible) ----------
let seed = Number(process.argv[2] ?? 20260716) >>> 0
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 0xffffffff
}
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const chance = (p) => rnd() < p
const yn = (p) => (chance(p) ? 'yes' : 'no')
const round = (n, d = 6) => Math.round(n * 10 ** d) / 10 ** d

// weighted pick: entries [value, weight]
const weighted = (entries) => {
  const tot = entries.reduce((a, e) => a + e[1], 0)
  let r = rnd() * tot
  for (const [v, w] of entries) {
    r -= w
    if (r <= 0) return v
  }
  return entries[entries.length - 1][0]
}
// choose k distinct codes from a weighted list (for multi-selects)
const multi = (entries, minK, maxK) => {
  const k = rint(minK, maxK)
  const chosen = new Set()
  let guard = 0
  while (chosen.size < k && guard++ < 40) chosen.add(weighted(entries))
  return [...chosen]
}

// ---------- reference vocab (codes must match the app) ----------
const PROTEIN = [
  ['beans', 26], ['fish', 22], ['groundnut', 14], ['soya_powder', 12], ['eggs', 9],
  ['agushi', 7], ['fish_powder', 6], ['tuna_flakes', 5], ['chicken', 3], ['meat', 2],
]
const WATER = [['borehole', 40], ['pipe_borne_1', 27], ['well', 18], ['stream', 10], ['harvested_rain_1', 5]]
const CHALLENGES = [
  ['delay_in_payment', 40], ['high_food_prices', 30], ['seasonality_of_the_food_item', 18],
  ['more_pupils_to_be_fed_than_ero', 14], ['nonavailability_of_kitchen_in_', 12],
  ['feeding_the_teachers', 8], ['nonavailability_of_food_item', 7], ['other', 4],
]
const FUNDING = [['personal_support', 44], ['credit_purchases', 28], ['bank_loan', 18], ['financiers', 10]]
const BUY = [['local_markets', 62], ['farm_gate', 30], ['others', 8]]
const KITCHEN = [['standard_kitchen', 46], ['shed', 34], ['under_tree', 20]]
const DAYS = [['five', 62], ['four', 20], ['three', 10], ['two', 5], ['one', 2], ['zero', 1]]
const EASE = [['easy', 42], ['very_easy', 24], ['somehow_easy', 20], ['difficult', 10], ['very_difficult', 4]]
const FIRST = ['KWAME','AKOSUA','YAW','ADWOA','KOFI','ABENA','MENSAH','ESI','KOJO','AMA','SETH','GIFTY','ISSAH','AZARA','KWABENA','EFUA','MOHAMMED','FATI','EMMANUEL','GRACE','SAMUEL','COMFORT','IBRAHIM','MARY']
const LAST = ['OWUSU','ASANTE','MENSAH','BOATENG','ADJEI','AGYEI','MOHAMMED','ABDULAI','TETTEH','AMANKWAH','DARKO','APPIAH','AZIZ','NKRUMAH','OSEI','ANANE','YEBOAH','DRAMANI','SULEMANA','QUARSHIE']
const PREFIX = ['ST MARY','ST JOSEPH','METHODIST','PRESBY','SDA','R/C','ANGLICAN','ISLAMIC','COMMUNITY','M/A','D/A','SALVATION ARMY','ZION','CHRIST THE KING']
const SUFFIX = ['BASIC SCHOOL','PRIMARY SCHOOL','D/A PRIMARY','M/A BASIC','R/C PRIMARY','JHS']
const name = () => `${pick(FIRST)} ${pick(LAST)}`
const phone = () => '0' + pick(['24','54','20','50','27','55','59']) + String(rint(1000000, 9999999))

// ---------- term calendar (2025/26) ----------
const TERMS = [
  { term: '1st Term', from: new Date('2025-09-02'), to: new Date('2025-12-19') },
  { term: '2nd Term', from: new Date('2026-01-08'), to: new Date('2026-04-02') },
  { term: '3rd Term', from: new Date('2026-04-06'), to: new Date('2026-07-13') },
]
const HOLIDAYS = new Set(['2025-12-05','2025-12-24','2025-12-25','2025-12-26','2025-12-31','2026-01-01','2026-03-06','2026-05-01'])
const iso = (d) => d.toISOString().slice(0, 10)
function randWeekday(w) {
  for (let i = 0; i < 60; i++) {
    const d = new Date(w.from.getTime() + Math.floor(rnd() * (w.to - w.from)))
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6 && !HOLIDAYS.has(iso(d))) return d
  }
  return w.from
}

// ---------- regional performance profile ----------
// A 0..1 quality dial per region so the map/drill-down tells a real story:
// northern savanna belt lags on certification & infrastructure; south leads.
const LAGGING = new Set(['SAVANNAH REGION','NORTH EAST REGION','OTI REGION','UPPER WEST REGION','NORTHERN REGION'])
const LEADING = new Set(['GREATER ACCRA REGION','ASHANTI REGION','EASTERN REGION','CENTRAL REGION'])
const regionQuality = (region) => {
  const base = LAGGING.has(region) ? 0.5 : LEADING.has(region) ? 0.86 : 0.7
  return Math.max(0.35, Math.min(0.95, base + (rnd() - 0.5) * 0.12))
}

// ---------- generate ----------
const submissions = []
const caterers = []
let sid = 700000000

const monitors = {}
for (const region of Object.keys(geo.centroids)) {
  monitors[region] = Array.from({ length: 3 }, () => name())
}

for (const { district, region } of geo.districts) {
  const [clon, clat] = geo.centroids[region]
  const q = regionQuality(region)
  const nSchools = weighted([[2, 3], [3, 5], [4, 3], [5, 1]])

  for (let s = 0; s < nSchools; s++) {
    const school = `${pick(PREFIX)} ${pick(SUFFIX)}${chance(0.4) ? ' ' + pick(['A', 'B', 'NO 1', 'NO 2']) : ''}`
    const lat = round(clat + (rnd() - 0.5) * 0.9)
    const lon = round(clon + (rnd() - 0.5) * 0.9)
    const emis = String(rint(100000000, 999999999))
    const boys = rint(60, 420)
    const girls = rint(60, 420)
    const total = boys + girls
    const nCat = weighted([[1, 6], [2, 3], [3, 1]])
    const kitchen = weighted(KITCHEN)
    const onPrem = yn(0.86)
    const catNames = Array.from({ length: nCat }, () => name())
    const catPhones = Array.from({ length: nCat }, () => phone())

    // which terms was this school visited? most schools 2-3 times.
    const visitTerms = TERMS.filter(() => chance(0.72))
    if (!visitTerms.length) visitTerms.push(pick(TERMS))

    for (const w of visitTerms) {
      const date = randWeekday(w)
      const dstr = iso(date)
      const start = new Date(date)
      start.setUTCHours(rint(8, 10), rint(0, 59))
      const end = new Date(start.getTime() + rint(35, 80) * 60000)

      // caterer enrolments usually sum to total; ~9% deliberate mismatch (data quality)
      const enrols = []
      if (nCat === 1) enrols.push(total)
      else {
        let left = total
        for (let i = 0; i < nCat - 1; i++) {
          const part = Math.floor(left / (nCat - i))
          enrols.push(part)
          left -= part
        }
        enrols.push(left)
      }
      const fedMismatch = chance(0.09)
      if (fedMismatch) enrols[0] += rint(-70, 90)
      const totalFed = enrols.reduce((a, b) => a + b, 0)

      const menuHave = yn(0.6 + q * 0.3)
      const recordsHave = yn(0.55 + q * 0.35)
      const knowsHandy = yn(0.45 + q * 0.4)

      const proteins = {}
      for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
        // Thu/Fri thinner protein in lagging regions (arrears narrative)
        const lean = (day === 'Thursday' || day === 'Friday') && q < 0.6
        proteins[day] = chance(lean ? 0.18 : 0.05) ? '' : multi(PROTEIN, 1, 2).join(' ')
      }

      const obs = (base) => yn(Math.max(0.15, Math.min(0.97, base * (0.6 + q * 0.55))))

      const sub = {
        _id: String(sid++),
        record_date: dstr,
        term: w.term,
        Region: region,
        district,
        school_name: school,
        emis_code: emis,
        lat: String(lat),
        lon: String(lon),
        No_boys: String(boys),
        No_girls: String(girls),
        total_no: String(total),
        t_caterers: String(nCat),
        total_fed_caterers: String(totalFed),
        Do_you_have_the_daily_records_: recordsHave,
        if_YES_are_they_in_use: recordsHave === 'yes' ? yn(0.85) : '',
        accordingMenu: menuHave,
        if_YES_is_it_being_followed: menuHave === 'yes' ? yn(0.55 + q * 0.35) : '',
        meal_prepared_on_premises: onPrem,
        What_type_of_kitchen_is_availa: onPrem === 'yes' ? kitchen : '',
        Is_it_in_use: onPrem === 'yes' && kitchen === 'standard_kitchen' ? yn(0.9) : '',
        What_is_the_source_of_water_fo: multi(WATER, 1, 2).join(' '),
        natSecVF: String(rint(0, 1)),
        rCorVF: String(rint(0, 3)),
        rCorVF_001: String(rint(1, 4)),
        Have_you_received_a_nsurance_NHIS_card: yn(0.4 + q * 0.4),
        Do_you_know_about_the_Handy_Me: knowsHandy,
        Do_you_use_the_Handy_Measure_i: knowsHandy === 'yes' ? yn(0.7) : '',
        Do_you_use_the_Handy_Measure_i_001: knowsHandy === 'yes' ? yn(0.66) : '',
        How_easy_is_the_use_ng_and_serving_meals: weighted(EASE),
        ...proteins,
        Where_do_you_buy_your_foodstuf: multi(BUY, 1, 2).join(' '),
        What_percentage_of_f_are_locally_produced: String(rint(25, 95)),
        Do_you_know_of_any_FBOs: yn(0.5),
        Do_you_buy_from_the_FBOs: yn(0.4),
        How_many_days_do_you_cook_in_a_week: weighted(DAYS),
        What_is_your_source_of_Financi: multi(FUNDING, 1, 2).join(' '),
        What_Challenges_do_you_face_as: multi(CHALLENGES, 1, 3).join(' '),
        Do_you_eat_the_school_meals: yn(0.9),
        How_many_times_do_yo_chool_feeding_melas_: String(rint(1, 3)),
        Do_you_come_to_schoo_chool_feeding_meals_: yn(0.6),
        Apron: obs(0.7),
        Protective_shoes_safety_shoes: obs(0.5),
        Personal_Hygiene_of_caterer_cooks: obs(0.85),
        Meal_served_on_tables: obs(0.62),
        Food_Warmer_for_serving_meals: obs(0.72),
        Caterer_school_owned_feeding_bowls: obs(0.8),
        Food_Quantity_sufficient_per_child: obs(0.83),
        Quality_of_meals_ser_use_your_discretion: obs(0.88),
        Monitor_Name: pick(monitors[region]),
      }
      submissions.push(sub)

      // NCDs (cooking days). A visit reports the current term as-at the visit date,
      // and any earlier terms in full — mirroring Q15.5–15.7 of the form.
      const termIdx = TERMS.findIndex((t) => t.term === w.term)
      const progress = Math.max(0.08, Math.min(1, (date - w.from) / (w.to - w.from)))
      const FULL_TERM = 65 // ~13 school weeks × 5 days
      const ncdFor = (i) => {
        if (i > termIdx) return '' // term hasn't happened yet
        if (i < termIdx) return String(rint(56, FULL_TERM)) // completed term
        return String(Math.max(3, Math.round(FULL_TERM * progress * (0.9 + rnd() * 0.12))))
      }
      const ncd = [ncdFor(0), ncdFor(1), ncdFor(2)]

      // caterer rows — certification is the deliberately weak national indicator
      for (let c = 0; c < nCat; c++) {
        const screened = yn(0.55 + q * 0.35)
        const obtained = screened === 'yes' ? yn(0.55 + q * 0.3) : 'no'
        const f = rint(1, 3)
        const m = rint(0, 2)
        const totalCooks = f + m
        // cooks certified lags: fraction scales with region quality
        const certCooks = obtained === 'yes' ? Math.round(totalCooks * (0.3 + q * 0.5) * rnd()) : rint(0, Math.max(0, totalCooks - 1))
        caterers.push({
          _id: sub._id,
          term: w.term,
          record_date: dstr,
          Region: region,
          district,
          school_name: school,
          caterer_name: catNames[c],
          phone: catPhones[c],
          enrollment: String(enrols[c]),
          health_screened: screened,
          cert_obtained: obtained,
          cert_inspected: obtained === 'yes' ? (chance(0.75) ? 'seen' : 'not_available') : '',
          total_cooks: String(totalCooks),
          cooks_with_valid_cert: String(Math.min(totalCooks, certCooks)),
          ncd_1st_term: ncd[0],
          ncd_2nd_term: ncd[1],
          ncd_3rd_term: ncd[2],
        })
      }
    }
  }
}

const outDir = path.join(root, 'src', 'data')
fs.writeFileSync(path.join(outDir, 'submissions.json'), JSON.stringify(submissions))
fs.writeFileSync(path.join(outDir, 'caterers.json'), JSON.stringify(caterers))

const regionsCovered = new Set(submissions.map((s) => s.Region)).size
const districtsCovered = new Set(submissions.map((s) => s.district)).size
const schoolsCovered = new Set(submissions.map((s) => s.school_name + '|' + s.district)).size
console.log(
  `submissions: ${submissions.length}\ncaterers: ${caterers.length}\n` +
    `regions: ${regionsCovered}/16 · districts: ${districtsCovered}/261 · schools: ${schoolsCovered}\n` +
    `submissions.json: ${(fs.statSync(path.join(outDir, 'submissions.json')).size / 1e6).toFixed(2)} MB`,
)
