import submissionsRaw from './submissions.json'
import caterersRaw from './caterers.json'
import type { Submission, Caterer } from './types'

export const SUBMISSIONS = submissionsRaw as unknown as Submission[]
export const CATERERS = caterersRaw as unknown as Caterer[]

const collator = new Intl.Collator()
const uniqueSorted = (xs: string[]) => [...new Set(xs)].filter(Boolean).sort(collator.compare)

export const REGIONS = uniqueSorted(SUBMISSIONS.map((s) => s.Region))
export const TERMS = ['1st Term', '2nd Term', '3rd Term']

export const districtsIn = (region: string): string[] =>
  uniqueSorted(SUBMISSIONS.filter((s) => !region || s.Region === region).map((s) => s.district))

const sortedDates = SUBMISSIONS.map((s) => s.record_date).sort()
export const LATEST_VISIT_DATE = sortedDates[sortedDates.length - 1] ?? ''

/** Short region label without the trailing " REGION". */
export const shortRegion = (r: string) => r.replace(/ REGION$/, '')
