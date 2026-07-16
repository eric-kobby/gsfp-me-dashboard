import type { Filters } from '../data/types'
import { REGIONS, TERMS, districtsIn, shortRegion } from '../data/dataset'

interface Props {
  filters: Filters
  onChange: (next: Filters) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

/** Scope line, e.g. "All regions · 3rd Term". */
function scopeLabel(f: Filters): string {
  const place = f.district || (f.region ? shortRegion(f.region) : 'All regions')
  return `${place} · ${f.term || 'All terms'}`
}

export function FilterBar({ filters, onChange, theme, onToggleTheme }: Props) {
  const districts = districtsIn(filters.region)
  const isFiltered = !!(filters.region || filters.district || filters.term)

  return (
    <div className="filters">
      <select
        aria-label="Region"
        value={filters.region}
        onChange={(e) => onChange({ region: e.target.value, district: '', term: filters.term })}
      >
        <option value="">Region: All</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {shortRegion(r)}
          </option>
        ))}
      </select>

      <select
        aria-label="District"
        value={filters.district}
        onChange={(e) => onChange({ ...filters, district: e.target.value })}
      >
        <option value="">District: All</option>
        {districts.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select aria-label="Term" value={filters.term} onChange={(e) => onChange({ ...filters, term: e.target.value })}>
        <option value="">Term: All</option>
        {TERMS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {isFiltered && (
        <button className="reset-btn" onClick={() => onChange({ region: '', district: '', term: '' })}>
          Reset
        </button>
      )}

      <span className="scope-chip">{scopeLabel(filters)}</span>

      <button
        className="icon-btn"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        title="Toggle theme"
      >
        ◐
      </button>
    </div>
  )
}
