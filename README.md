# GSFP M&E Dashboard (React + TypeScript) — "Kente Ledger"

An interactive monitoring & evaluation dashboard for the Ghana School Feeding
Programme Zonal Coordinators tool, built with Vite + React + TypeScript.

## Design system

The UI implements the **"Kente Ledger"** handoff: the restraint of a central-bank
annual report. Source Serif 4 for numerals and section headers, Public Sans for
labels, warm-stone ground, and a ledger-row structure throughout
(`label · track · tabular number`) — no cards, no shadows on the page, 3px radius
max. The kente motif appears **exactly twice**: the 6px rule above the masthead
and the same rule atop the drill drawer (plus the gold left-border on the active
rail item). It is never a chart colour or a background texture.

Status colours (`--good` ≥75 · `--amber` 50–74 · `--crit` <50) are reserved and
never used as chart series. Donuts live **only inside the drill drawer** — the
page itself uses 100%-stacked ledger bars. A left section-index rail (01–10) with
IntersectionObserver scroll-spy navigates the page and collapses to a horizontal
strip under 1100px. Dark theme is a designed re-anchoring, not an inversion.

All tokens live in `src/index.css`; the reference bundle is
`Modern M&E Dashboard.zip` in the project root.

- **Full-bleed executive layout** — 4×2 KPI scorecard with sparklines and
  term-over-term deltas, then a responsive card grid that uses the full width.
- **Click-to-drill everything** — every KPI tile, section bar, *and* donut/pie
  segment drills region → district → school → individual visits, with a
  breadcrumb to climb back.
- **Region-demarcated map** — all 16 Ghana regions drawn with real boundaries and
  names; monitored regions are tinted (intensity ∝ visits) with school dots.
  Click a region to filter the whole dashboard to it.
- **Trend analysis** — key coverage indicators tracked term-over-term with a hover
  crosshair, plus monitoring volume per term.
- **Composition charts** — donuts (kitchen facilities, cooking days) and pies
  (water sources, Handy-Measures ease) with value + percent legends.

## Run it

```powershell
cd gsfp-dashboard
npm install          # first time only
npm run dev          # dev server at http://localhost:5173
npm run build        # production build into dist/
npm run preview      # serve the production build
```

> **Note on the folder name.** Because the project path contains an `&`
> ("GSFP M&E Tool"), the npm scripts call `node node_modules/vite/bin/vite.js`
> directly instead of the usual `vite`/`tsc` shims — the Windows `.cmd` shims
> break on the `&`. Keep it that way, or rename the parent folder to drop the `&`
> and you can restore the plain `vite` / `tsc -b` scripts.

## Caterer payments (accounts report)

The masthead switches between **Monitoring** and **Caterer payments**. The payment
view turns monitoring submissions into a payable schedule:

```
Payable = pupils fed × cooking days (NCD) × rate per child per day
```

- **P1 Basis of payment** — payment period, editable rate, optional "cap enrolment
  at the head teacher's figure", and control totals (caterers / pupils / days / total).
- **P2 Disbursement summary** — roll-up by region or district for payment batches.
- **P3 Payment schedule** — one row per caterer with school, EMIS, phone, pupils,
  days, rate, amount and the verifying visit; **Export CSV** for accounts.

**Selection rule.** A monitoring visit reports the current term's cooking days
*as at the visit date*, and any earlier term in full (form Q15.5–15.7). So for
term T the engine considers every visit from term T onwards that carries a figure
for T and takes the **latest** — the most complete verified figure available.
Rows verified before the term closed are marked `■ PART` (days may be understated);
caterers with no health certificate sighted are marked `■ CERT` (flagged, not withheld).

> The rate ships as a **placeholder** and is stored in `localStorage`. Set the
> GSFP-approved rate before the schedule is used for disbursement.

Verify the arithmetic any time — this bundles the real `src/lib/payments.ts` and
cross-foots it against the data (unique rows, row arithmetic, schedule vs region
vs district roll-ups, CSV integrity):

```bash
npm run verify:payments        # optionally: npm run verify:payments -- 2.00
```

## Demo data (all 16 regions)

The app currently ships a **synthetic national dataset** — ~1,780 monitoring
visits across all 16 regions and all 261 districts (~830 schools), generated for
demo/feedback purposes. It is illustrative, not official GSFP data (the footer
says so). Regenerate or reshape it with:

```bash
cd gsfp-dashboard
node tools/generate-national-data.mjs [seed]   # writes src/data/{submissions,caterers}.json
npm run build                                    # or restart the dev server
```

The generator (`tools/generate-national-data.mjs`) uses `tools/geo.json`
(district→region + region centroids) and gives each region a performance profile,
so the map choropleth and drill-downs tell a realistic story (the northern belt
lags on certification; cooks-certified is the weak national indicator). It writes
the **same** JSON files the Kobo pipeline produces — so running the real
`Sync-AppData.ps1` later simply replaces the demo data with live submissions.

## Deploy (static site)

`npm run build` emits a self-contained static site in `dist/` (works offline,
`base: './'` so it runs from any path). Pick any static host:

- **Netlify** — drag the `dist/` folder onto app.netlify.com/drop. Instant URL.
- **Vercel** — `npx vercel deploy dist --prod` (or import the repo).
- **Cloudflare Pages / GitHub Pages** — publish the `dist/` folder.
- **Local sharing** — `npm run preview` serves the production build.

The bundle is ~4 MB raw but **~267 KB gzipped** (the data is embedded); hosts
serve it compressed, so first load is small and all filtering is client-side.

## How the data flows

The dashboard reads two bundled JSON files, `src/data/submissions.json` and
`src/data/caterers.json`, imported at build time (no runtime API calls — it works
offline and deploys as static files).

To refresh with new KoboToolbox submissions:

```powershell
cd ..
powershell -ExecutionPolicy Bypass -File .\Refresh-KoboData.ps1   # pull -> data\*.csv
cd gsfp-dashboard
powershell -ExecutionPolicy Bypass -File .\Sync-AppData.ps1        # data\*.csv -> src\data\*.json
npm run build                                                      # or restart npm run dev
```

## Structure

```
src/
  data/        types, the JSON datasets, and derived constants (regions, terms)
  lib/         metrics.ts (indicator + drill-down engine), format, tooltip
  components/
    charts/    BarList, VBars, Heatmap, LineChart, Donut, Sparkline, GhanaMap  (dependency-free SVG/CSS)
    sections/  one component per dashboard section (Coverage, Trend, Composition, …)
    Filters, KpiGrid, DrillDrawer
  App.tsx      state: filters, theme, active drill target
```

### Map data

`src/data/ghanaRegions.json` holds simplified ADM1 boundaries for Ghana's 16
regions, derived from **geoBoundaries** (gbOpen, CC BY 4.0) — downloaded, reduced
with Douglas–Peucker to ~2,100 points, and matched to the survey's region names.
`GhanaMap.tsx` fits an equirectangular projection to the polygons at runtime, so
no mapping library is needed. The boundaries are static; they don't change when
survey data refreshes.

### The indicator model

Every KPI is an `Indicator` (`src/lib/metrics.ts`) with an `aggregate(slice)`
function that works over **any** subset of the data. The same function powers the
headline tile, the drill-down hero number, and each bar at every drill level —
so a metric is defined once and stays consistent everywhere. `breakdown()` groups
a slice along a dimension and re-runs the aggregate per group; the drawer chains
these to drill down. Percentage bars are coloured by performance
(green ≥ 75 %, amber 50–74 %, red < 50 %).

## Design

Light theme is primary; the dark theme is available via the `◐` toggle and
persists in `localStorage`. The categorical series palette is colour-blind-safe
via lightness separation. Fonts are bundled locally via `@fontsource`
(`source-serif-4`, `public-sans`) — no CDN requests.
