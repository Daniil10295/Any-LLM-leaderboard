import { SearchX } from 'lucide-react'

type EmptyStateProps = {
  benchmarkName: string
  hasFilters: boolean
  onReset: () => void
}

export function EmptyState({ benchmarkName, hasFilters, onReset }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon"><SearchX aria-hidden="true" /></span>
      <p className="eyebrow">No eligible models</p>
      <h3>{hasFilters ? 'Nothing matches this cut.' : `No tracked ${benchmarkName} results yet.`}</h3>
      <p>
        {hasFilters
          ? 'Try clearing the search, provider, or price ceiling.'
          : 'Missing scores are never estimated or displayed as zero.'}
      </p>
      {hasFilters && <button className="button button--secondary" type="button" onClick={onReset}>Reset filters</button>}
    </div>
  )
}
