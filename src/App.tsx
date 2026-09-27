import { useMemo, useState, type CSSProperties } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  CircleDollarSign,
  Database,
  ExternalLink,
  FileCode2,
  Github,
  GitCompareArrows,
  Info,
  Layers3,
  LayoutList,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { catalog, blendedPrice, categoryLabels, categoryOrder, compareScores, estimatedTaskCost, formatContext, formatDate, formatPrice, formatScore, formatTaskCost, getResult, normalizedQuality } from './catalog'
import { ProviderLogo } from './components/ProviderLogo'
import { EmptyState } from './components/EmptyState'
import type { Benchmark, BenchmarkCategory, Model, Provider } from './types'

type ViewMode = 'towers' | 'list'
type SortMode = 'score' | 'price' | 'value' | 'newest' | 'context'
type AccessFilter = 'all' | 'closed' | 'open-weights'
type WorkloadId = 'quick' | 'standard' | 'agent'

type ValueRow = {
  model: Model
  provider: Provider
  score: number
  quality: number
  cost: number
  rawValue: number
  valueIndex: number
}

const providersById = new Map(catalog.providers.map((provider) => [provider.id, provider]))
const benchmarksById = new Map(catalog.benchmarks.map((benchmark) => [benchmark.id, benchmark]))
const MAX_PRICE = Math.max(...catalog.models.map((model) => model.inputPrice ?? 0))

const WORKLOADS: Record<WorkloadId, { label: string; short: string; inputTokens: number; outputTokens: number }> = {
  quick: { label: 'Quick turn', short: '2K in · 500 out', inputTokens: 2_000, outputTokens: 500 },
  standard: { label: 'Standard task', short: '6K in · 1.5K out', inputTokens: 6_000, outputTokens: 1_500 },
  agent: { label: 'Agent run', short: '30K in · 8K out', inputTokens: 30_000, outputTokens: 8_000 },
}

const TASK_COST_LIMITS = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.5]

function providerFor(model: Model): Provider {
  return providersById.get(model.providerId) ?? {
    id: model.providerId,
    name: model.providerId,
    accent: '#665df5',
    websiteUrl: '#',
  }
}

function valueFor(model: Model, benchmark: Benchmark): number | null {
  const result = getResult(model, benchmark.id)
  const cost = blendedPrice(model)
  if (!result || cost === null || cost <= 0) return null
  const quality = normalizedQuality(result.score, benchmark)
  if (quality === null) return null
  return quality / cost
}

function App() {
  const [benchmarkId, setBenchmarkId] = useState('deepswe')
  const [view, setView] = useState<ViewMode>('towers')
  const [providerId, setProviderId] = useState('all')
  const [query, setQuery] = useState('')
  const [priceCap, setPriceCap] = useState(MAX_PRICE)
  const [selectedId, setSelectedId] = useState('gpt-6-astra')
  const [sortMode, setSortMode] = useState<SortMode>('score')
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all')
  const [minContext, setMinContext] = useState(0)
  const [workloadId, setWorkloadId] = useState<WorkloadId>('standard')
  const [maxTaskCost, setMaxTaskCost] = useState('any')
  const [releaseAfter, setReleaseAfter] = useState('')
  const [updatedAfter, setUpdatedAfter] = useState('')
  const [comparisonIds, setComparisonIds] = useState(['gpt-6-astra', 'claude-opus-5-5', 'gemini-3-8-flash'])
  const [comparisonCategory, setComparisonCategory] = useState<BenchmarkCategory | 'all'>('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const benchmark = benchmarksById.get(benchmarkId) ?? catalog.benchmarks[0]
  const workload = WORKLOADS[workloadId]
  const eligibleCount = catalog.models.filter((model) => getResult(model, benchmark.id)).length
  const hasFilters = Boolean(query.trim() || providerId !== 'all' || priceCap < MAX_PRICE || accessFilter !== 'all' || minContext > 0 || workloadId !== 'standard' || maxTaskCost !== 'any' || releaseAfter || updatedAfter)

  const visibleModels = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    return catalog.models
      .filter((model) => getResult(model, benchmark.id))
      .filter((model) => providerId === 'all' || model.providerId === providerId)
      .filter((model) => accessFilter === 'all' || model.access === accessFilter)
      .filter((model) => (model.contextWindow ?? 0) >= minContext)
      .filter((model) => !releaseAfter || Boolean(model.releasedAt && model.releasedAt >= releaseAfter))
      .filter((model) => !updatedAfter || model.reviewedAt >= updatedAfter)
      .filter((model) => {
        if (maxTaskCost === 'any') return true
        const cost = estimatedTaskCost(model, workload.inputTokens, workload.outputTokens)
        return cost !== null && cost <= Number(maxTaskCost)
      })
      .filter((model) => {
        if (!cleanQuery) return true
        const provider = providerFor(model)
        return model.name.toLowerCase().includes(cleanQuery) || provider.name.toLowerCase().includes(cleanQuery)
      })
      .filter((model) => priceCap >= MAX_PRICE || (model.inputPrice !== undefined && model.inputPrice <= priceCap))
      .sort((a, b) => {
        const aScore = getResult(a, benchmark.id)?.score ?? 0
        const bScore = getResult(b, benchmark.id)?.score ?? 0
        return compareScores(aScore, bScore, benchmark)
      })
  }, [accessFilter, benchmark, maxTaskCost, minContext, priceCap, providerId, query, releaseAfter, updatedAfter, workload])

  const valueRows = useMemo<ValueRow[]>(() => {
    const raw = visibleModels.flatMap((model) => {
      const result = getResult(model, benchmark.id)
      const provider = providerFor(model)
      const cost = blendedPrice(model)
      const quality = result ? normalizedQuality(result.score, benchmark) : null
      if (!result || cost === null || cost <= 0 || quality === null) return []
      return [{ model, provider, score: result.score, quality, cost, rawValue: quality / cost, valueIndex: 0 }]
    }).sort((a, b) => b.rawValue - a.rawValue)
    const maxValue = raw[0]?.rawValue ?? 1
    return raw.map((row) => ({ ...row, valueIndex: Math.round((row.rawValue / maxValue) * 100) }))
  }, [benchmark, visibleModels])

  const rankedModels = useMemo(() => {
    const rows = [...visibleModels]
    if (sortMode === 'price') {
      rows.sort((a, b) => (a.inputPrice ?? Number.POSITIVE_INFINITY) - (b.inputPrice ?? Number.POSITIVE_INFINITY))
    }
    if (sortMode === 'value') {
      rows.sort((a, b) => (valueFor(b, benchmark) ?? -1) - (valueFor(a, benchmark) ?? -1))
    }
    if (sortMode === 'newest') {
      rows.sort((a, b) => (b.releasedAt ?? '').localeCompare(a.releasedAt ?? ''))
    }
    if (sortMode === 'context') {
      rows.sort((a, b) => (b.contextWindow ?? 0) - (a.contextWindow ?? 0))
    }
    return rows
  }, [benchmark, sortMode, visibleModels])

  const comparisonModels = comparisonIds.flatMap((id) => {
    const model = catalog.models.find((item) => item.id === id)
    return model ? [model] : []
  })
  const comparisonBenchmarks = catalog.benchmarks
    .filter((item) => comparisonCategory === 'all' || item.category === comparisonCategory)
    .filter((item) => comparisonModels.some((model) => getResult(model, item.id)))

  const selectedModel = visibleModels.find((model) => model.id === selectedId) ?? visibleModels[0]
  const selectedProvider = selectedModel ? providerFor(selectedModel) : undefined
  const selectedResult = selectedModel ? getResult(selectedModel, benchmark.id) : undefined
  const heroBenchmark = benchmarksById.get('deepswe') ?? benchmark
  const heroLeaders = catalog.models
    .filter((model) => getResult(model, heroBenchmark.id))
    .sort((a, b) => compareScores(getResult(a, heroBenchmark.id)!.score, getResult(b, heroBenchmark.id)!.score, heroBenchmark))
    .slice(0, 3)

  const resetFilters = () => {
    setQuery('')
    setProviderId('all')
    setPriceCap(MAX_PRICE)
    setAccessFilter('all')
    setMinContext(0)
    setWorkloadId('standard')
    setMaxTaskCost('any')
    setReleaseAfter('')
    setUpdatedAfter('')
  }

  const selectFromDirectory = (id: string) => {
    setBenchmarkId(id)
    requestAnimationFrame(() => document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const updateComparison = (index: number, id: string) => {
    setComparisonIds((current) => current.map((item, itemIndex) => itemIndex === index ? id : item))
  }

  const addComparisonSlot = () => {
    const next = catalog.models.find((model) => !comparisonIds.includes(model.id))
    if (next && comparisonIds.length < 4) setComparisonIds((current) => [...current, next.id])
  }

  const addSelectedToComparison = () => {
    if (!selectedModel || comparisonIds.includes(selectedModel.id)) return
    setComparisonIds((current) => current.length < 4 ? [...current, selectedModel.id] : [...current.slice(0, 3), selectedModel.id])
    requestAnimationFrame(() => document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' }))
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Any Bench home">
          <span className="brand__mark"><span>A</span><i>/</i><span>B</span></span>
          <span className="brand__name">ANY / BENCH</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#compare">Leaderboard</a>
          <a href="#comparison">Compare</a>
          <a href="#value">Value</a>
          <a href="#benchmarks">Benchmarks</a>
          <a href="#methodology">Method</a>
        </nav>
        <div className="header-meta">
          <span><span className="status-dot" />Catalog v{catalog.version}</span>
          <a className="button button--dark button--small" href="https://github.com/Daniil10295/Any-LLM-leaderboard" target="_blank" rel="noreferrer">
            <Github aria-hidden="true" /> Repository
          </a>
        </div>
        <button className="mobile-menu-button" type="button" aria-label="Toggle navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
          {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        {mobileMenuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <a href="#compare" onClick={closeMobileMenu}>Leaderboard</a>
            <a href="#comparison" onClick={closeMobileMenu}>Compare models</a>
            <a href="#value" onClick={closeMobileMenu}>Value</a>
            <a href="#benchmarks" onClick={closeMobileMenu}>Benchmarks</a>
            <a href="#methodology" onClick={closeMobileMenu}>Method</a>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="hero section-shell">
          <div className="hero__copy">
            <div className="eyebrow-row">
              <span className="eyebrow"><Sparkles aria-hidden="true" /> Independent model comparison</span>
              <span className="hero__date">Updated {formatDate(catalog.updatedAt)}</span>
            </div>
            <h1>One board.<br /><em>Every model.</em></h1>
            <p className="hero__lede">Cut through launch-day charts. Compare frontier AI on capability, token price, and real value—with missing data left honestly blank.</p>
            <div className="hero__actions">
              <a className="button button--primary" href="#compare">Explore the board <ArrowDownRight aria-hidden="true" /></a>
              <a className="text-link" href="#methodology">How scores work <ArrowRight aria-hidden="true" /></a>
            </div>
            <dl className="hero__stats">
              <div><dt>{catalog.models.length}</dt><dd>Models</dd></div>
              <div><dt>{catalog.providers.length}</dt><dd>Providers</dd></div>
              <div><dt>{catalog.benchmarks.length}</dt><dd>Benchmarks</dd></div>
              <div><dt>{catalog.models.reduce((sum, model) => sum + model.results.length, 0)}</dt><dd>Results</dd></div>
            </dl>
          </div>

          <div className="hero-board" aria-label={`Top models on ${heroBenchmark.name}`}>
            <div className="hero-board__header">
              <div>
                <span className="mini-label">Current view</span>
                <h2>{heroBenchmark.name}</h2>
              </div>
              <span className="version-tag">{heroBenchmark.version}</span>
            </div>
            <div className="mini-podium">
              {heroLeaders.map((model, index) => {
                const provider = providerFor(model)
                const result = getResult(model, heroBenchmark.id)!
                const height = normalizedQuality(result.score, heroBenchmark) ?? 50
                return (
                  <div className={`mini-podium__item mini-podium__item--${index + 1}`} key={model.id}>
                    <div className="mini-podium__score">{formatScore(result.score, heroBenchmark)}</div>
                    <div className="mini-podium__bar" style={{ '--podium-height': `${Math.max(30, height)}%`, '--provider': provider.accent } as CSSProperties}>
                      <ProviderLogo provider={provider} size="md" />
                    </div>
                    <strong>{model.name}</strong>
                    <span>{provider.name}</span>
                  </div>
                )
              })}
            </div>
            <div className="hero-board__footer">
              <span><span className="pulse-dot" /> {heroLeaders.length} of {catalog.models.length} shown</span>
              <a href="#compare">Full ranking <ArrowRight aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <div className="provider-rail" aria-label="Tracked providers">
          <span className="provider-rail__label">TRACKING</span>
          <div className="provider-rail__items">
            {catalog.providers.map((provider) => (
              <span className="provider-rail__item" key={provider.id}><ProviderLogo provider={provider} size="sm" />{provider.name}</span>
            ))}
          </div>
        </div>

        <section className="compare section-shell" id="compare">
          <div className="section-heading">
            <div>
              <span className="section-index">01 / LEADERBOARD</span>
              <h2>Choose the signal.<br />See who leads.</h2>
            </div>
            <p>Every chart is drawn from the same sparse catalog. If a model was not evaluated on a benchmark, it is not placed on that board.</p>
          </div>

          <div className="control-panel">
            <label className="control control--search">
              <span>Find a model</span>
              <span className="input-wrap"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search model or lab" /></span>
            </label>
            <label className="control control--wide">
              <span>Benchmark</span>
              <span className="select-wrap">
                <select value={benchmarkId} onChange={(event) => setBenchmarkId(event.target.value)}>
                  {categoryOrder.map((category) => {
                    const options = catalog.benchmarks.filter((item) => item.category === category)
                    if (!options.length) return null
                    return <optgroup label={categoryLabels[category]} key={category}>{options.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</optgroup>
                  })}
                </select>
                <ChevronDown aria-hidden="true" />
              </span>
            </label>
            <label className="control">
              <span>Provider</span>
              <span className="select-wrap">
                <select value={providerId} onChange={(event) => setProviderId(event.target.value)}>
                  <option value="all">All providers</option>
                  {catalog.providers.map((provider) => <option value={provider.id} key={provider.id}>{provider.name}</option>)}
                </select>
                <ChevronDown aria-hidden="true" />
              </span>
            </label>
            <label className="control control--price">
              <span>Max input price <b>{priceCap >= MAX_PRICE ? 'Any price' : `${formatPrice(priceCap)} / M`}</b></span>
              <input type="range" min="0.25" max={MAX_PRICE} step="0.25" value={priceCap} onChange={(event) => setPriceCap(Number(event.target.value))} aria-label="Maximum input price per million tokens" />
              <span className="range-labels"><small>$0.25</small><small>{formatPrice(MAX_PRICE)}+</small></span>
            </label>
            <div className="control control--view">
              <span>View</span>
              <div className="view-switch" aria-label="Comparison view">
                <button type="button" className={view === 'towers' ? 'is-active' : ''} onClick={() => setView('towers')} aria-pressed={view === 'towers'}><BarChart3 aria-hidden="true" /> Towers</button>
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-pressed={view === 'list'}><LayoutList aria-hidden="true" /> List</button>
              </div>
            </div>
          </div>

          <div className="advanced-filters" aria-label="Advanced model filters">
            <div className="advanced-filters__header">
              <div className="advanced-filters__title"><SlidersHorizontal aria-hidden="true" /><span>Advanced filters</span><small>{hasFilters ? 'Custom filter set active' : 'Showing every eligible model'}</small></div>
              <button className="advanced-filters__reset" type="button" onClick={resetFilters} disabled={!hasFilters}>Clear all filters</button>
            </div>
            <div className="advanced-filters__grid">
              <label className="refine-control"><span>Access type</span><span className="select-wrap"><select value={accessFilter} onChange={(event) => setAccessFilter(event.target.value as AccessFilter)}><option value="all">Any access</option><option value="closed">Closed API</option><option value="open-weights">Open weights</option></select><ChevronDown aria-hidden="true" /></span></label>
              <label className="refine-control"><span>Minimum context</span><span className="select-wrap"><select value={minContext} onChange={(event) => setMinContext(Number(event.target.value))}><option value="0">Any context</option><option value="128000">128K or more</option><option value="200000">200K or more</option><option value="500000">500K or more</option><option value="1000000">1M or more</option></select><ChevronDown aria-hidden="true" /></span></label>
              <label className="refine-control"><span>Average-task profile</span><span className="select-wrap"><select value={workloadId} onChange={(event) => setWorkloadId(event.target.value as WorkloadId)}>{Object.entries(WORKLOADS).map(([id, item]) => <option key={id} value={id}>{item.label} — {item.short}</option>)}</select><ChevronDown aria-hidden="true" /></span></label>
              <label className="refine-control"><span>Maximum average task cost</span><span className="select-wrap"><select value={maxTaskCost} onChange={(event) => setMaxTaskCost(event.target.value)}><option value="any">Any task cost</option>{TASK_COST_LIMITS.map((cost) => <option key={cost} value={cost}>Up to {formatTaskCost(cost)}</option>)}</select><ChevronDown aria-hidden="true" /></span></label>
              <label className="refine-control refine-control--date"><span>Published on or after</span><input type="date" value={releaseAfter} max={catalog.updatedAt} onChange={(event) => setReleaseAfter(event.target.value)} aria-label="Published on or after" /></label>
              <label className="refine-control refine-control--date"><span>Data updated on or after</span><input type="date" value={updatedAfter} max={catalog.updatedAt} onChange={(event) => setUpdatedAfter(event.target.value)} aria-label="Data updated on or after" /></label>
            </div>
          </div>

          <div className="benchmark-context">
            <div className="benchmark-context__icon"><Layers3 aria-hidden="true" /></div>
            <div className="benchmark-context__copy">
              <div className="benchmark-context__title">
                <h3>{benchmark.name}</h3>
                <span>{categoryLabels[benchmark.category]}</span>
              </div>
              <p>{benchmark.description}</p>
            </div>
            <dl className="benchmark-context__facts">
              <div><dt>Metric</dt><dd>{benchmark.metricLabel}</dd></div>
              <div><dt>Version</dt><dd>{benchmark.version}</dd></div>
              <div><dt>Coverage</dt><dd>{eligibleCount} / {catalog.models.length} models</dd></div>
            </dl>
            <a className="icon-link" href={benchmark.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open ${benchmark.name} source`}><ExternalLink aria-hidden="true" /></a>
          </div>

          <div className="results-layout">
            <div className="results-card">
              <div className="results-card__header">
                <div>
                  <span className="mini-label">{view === 'towers' ? 'Visual ranking' : 'Detailed ranking'}</span>
                  <h3>{visibleModels.length} model{visibleModels.length === 1 ? '' : 's'} in this cut</h3>
                </div>
                <div className="results-card__actions">
                  <a className="compare-jump" href="#comparison"><GitCompareArrows aria-hidden="true" /> Compare models</a>
                  {hasFilters && <button type="button" className="quiet-button" onClick={resetFilters}>Reset filters</button>}
                  {view === 'list' && (
                    <label className="sort-control">Sort
                      <span className="select-wrap select-wrap--small"><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="score">Score</option><option value="value">Value</option><option value="price">Input price</option><option value="newest">Newest</option><option value="context">Context</option></select><ChevronDown aria-hidden="true" /></span>
                    </label>
                  )}
                </div>
              </div>

              {visibleModels.length === 0 ? (
                <EmptyState benchmarkName={benchmark.name} hasFilters={hasFilters} onReset={resetFilters} />
              ) : view === 'towers' ? (
                <div className="tower-chart-wrap">
                  <div className="tower-axis" aria-hidden="true"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
                  <div className="tower-scroller">
                    <div className="tower-chart" style={{ minWidth: `${Math.max(620, visibleModels.length * 122)}px` }}>
                      <div className="chart-grid" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                      <div className="towers">
                        {visibleModels.map((model, index) => {
                          const provider = providerFor(model)
                          const result = getResult(model, benchmark.id)!
                          const quality = normalizedQuality(result.score, benchmark) ?? 50
                          const selected = selectedModel?.id === model.id
                          return (
                            <button
                              type="button"
                              className={`tower${selected ? ' is-selected' : ''}`}
                              key={model.id}
                              onClick={() => setSelectedId(model.id)}
                              aria-label={`${model.name}, rank ${index + 1}, ${formatScore(result.score, benchmark)}`}
                              style={{ '--tower-height': `${Math.max(7, quality)}%`, '--provider': provider.accent } as CSSProperties}
                            >
                              <div className="tower__plot">
                                <span className="tower__score">{formatScore(result.score, benchmark)}</span>
                                <div className="tower__bar"><ProviderLogo provider={provider} size="md" /></div>
                              </div>
                              <span className="tower__rank">#{index + 1}</span>
                              <strong>{model.name}</strong>
                              <small>{provider.name}</small>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="model-list" role="table" aria-label={`${benchmark.name} model rankings`}>
                  <div className="model-list__head" role="row">
                    <span>Rank / model</span><span>Score</span><span>Avg. task</span><span>Context</span><span>Published</span><span>Updated</span><span aria-hidden="true" />
                  </div>
                  {rankedModels.map((model, index) => {
                    const provider = providerFor(model)
                    const result = getResult(model, benchmark.id)!
                    const taskCost = estimatedTaskCost(model, workload.inputTokens, workload.outputTokens)
                    return (
                      <button type="button" className={`model-row${selectedModel?.id === model.id ? ' is-selected' : ''}`} role="row" key={model.id} onClick={() => setSelectedId(model.id)}>
                        <span className="model-row__identity" role="cell"><i>{index + 1}</i><ProviderLogo provider={provider} size="md" /><span><strong>{model.name}</strong><small>{provider.name} · {model.access === 'open-weights' ? 'Open weights' : 'Closed'}</small></span></span>
                        <strong className="model-row__score" role="cell">{formatScore(result.score, benchmark)}</strong>
                        <span role="cell">{taskCost === null ? '—' : formatTaskCost(taskCost)}</span>
                        <span role="cell">{formatContext(model.contextWindow)}</span>
                        <time role="cell" dateTime={model.releasedAt}>{model.releasedAt ? formatDate(model.releasedAt) : 'Unknown'}</time>
                        <time role="cell" dateTime={model.reviewedAt}>{formatDate(model.reviewedAt)}</time>
                        <ArrowRight aria-hidden="true" />
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="sparse-note"><Info aria-hidden="true" /><span><strong>Missing means missing.</strong> Models without a published {benchmark.shortName} result are excluded—not scored as zero.</span></div>
            </div>

            <aside className="model-inspector" aria-live="polite">
              {selectedModel && selectedProvider && selectedResult ? (
                <>
                  <div className="model-inspector__topline"><span>Model card · {selectedModel.results.length}/{catalog.benchmarks.length} covered</span><span className="model-inspector__badges"><span className="access-badge">{selectedModel.access === 'open-weights' ? 'Open weights' : 'Closed API'}</span><span className={`status-badge status-badge--${selectedModel.status}`}><i />{selectedModel.status}</span></span></div>
                  <div className="model-inspector__identity">
                    <ProviderLogo provider={selectedProvider} size="lg" />
                    <div><span>{selectedProvider.name}</span><h3>{selectedModel.name}</h3></div>
                  </div>
                  <p className="model-inspector__description">{selectedModel.description}</p>
                  <div className="active-score" style={{ '--provider': selectedProvider.accent } as CSSProperties}>
                    <div><span>{benchmark.shortName}</span><strong>{formatScore(selectedResult.score, benchmark)}</strong></div>
                    <span className="active-score__rank">#{visibleModels.findIndex((model) => model.id === selectedModel.id) + 1}</span>
                  </div>
                  <dl className="price-facts">
                    <div><dt>Input / 1M</dt><dd>{selectedModel.inputPrice === undefined ? '—' : formatPrice(selectedModel.inputPrice)}</dd></div>
                    <div><dt>Output / 1M</dt><dd>{selectedModel.outputPrice === undefined ? '—' : formatPrice(selectedModel.outputPrice)}</dd></div>
                    <div><dt>Avg. {workload.label}</dt><dd>{(() => { const cost = estimatedTaskCost(selectedModel, workload.inputTokens, workload.outputTokens); return cost === null ? '—' : formatTaskCost(cost) })()}</dd></div>
                    <div><dt>Context</dt><dd>{formatContext(selectedModel.contextWindow)}</dd></div>
                    <div><dt>Published</dt><dd>{selectedModel.releasedAt ? formatDate(selectedModel.releasedAt) : 'Unknown'}</dd></div>
                    <div><dt>Data updated</dt><dd>{formatDate(selectedModel.reviewedAt)}</dd></div>
                  </dl>
                  <button className="inspector-compare" type="button" onClick={addSelectedToComparison} disabled={comparisonIds.includes(selectedModel.id)}><GitCompareArrows aria-hidden="true" />{comparisonIds.includes(selectedModel.id) ? 'Already in comparison' : 'Add to comparison'}</button>
                  <div className="also-tested">
                    <div className="also-tested__header"><span>Also benchmarked</span><span>{selectedModel.results.length} results</span></div>
                    <div className="also-tested__rows">
                      {selectedModel.results.filter((result) => result.benchmarkId !== benchmark.id).slice(0, 5).map((result) => {
                        const itemBenchmark = benchmarksById.get(result.benchmarkId)
                        if (!itemBenchmark) return null
                        return <button type="button" key={result.benchmarkId} onClick={() => setBenchmarkId(result.benchmarkId)}><span>{itemBenchmark.shortName}</span><strong>{formatScore(result.score, itemBenchmark)}</strong></button>
                      })}
                    </div>
                  </div>
                  <div className="model-inspector__footer">
                    <span>Reviewed {formatDate(selectedModel.reviewedAt)}</span>
                    <a href={selectedResult.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink aria-hidden="true" /></a>
                  </div>
                </>
              ) : <div className="inspector-empty"><Database aria-hidden="true" /><p>Select a model to inspect its data.</p></div>}
            </aside>
          </div>

          <section className="comparison-panel" id="comparison">
            <div className="comparison-panel__heading">
              <div className="comparison-panel__icon"><GitCompareArrows aria-hidden="true" /></div>
              <div><span className="section-index">02 / SIDE-BY-SIDE</span><h2>Compare models,<br />not launch slides.</h2></div>
              <p>Put up to four models across many benchmarks at once. Blank cells mean no result is recorded—never a zero.</p>
            </div>

            <div className="comparison-toolbar">
              <label><span>Benchmark set</span><span className="select-wrap"><select value={comparisonCategory} onChange={(event) => setComparisonCategory(event.target.value as BenchmarkCategory | 'all')}><option value="all">All benchmarks ({catalog.benchmarks.length})</option>{categoryOrder.map((category) => { const count = catalog.benchmarks.filter((item) => item.category === category).length; return count ? <option value={category} key={category}>{categoryLabels[category]} ({count})</option> : null })}</select><ChevronDown aria-hidden="true" /></span></label>
              <div className="comparison-toolbar__summary"><span>{comparisonModels.length} models</span><i /> <span>{comparisonBenchmarks.length} benchmarks</span></div>
              {comparisonIds.length < 4 && <button type="button" onClick={addComparisonSlot}>+ Add model</button>}
            </div>

            <div className="comparison-table-wrap">
              <div className="comparison-grid comparison-grid--models" style={{ '--compare-count': comparisonModels.length } as CSSProperties}>
                <div className="comparison-label-cell"><span>Models</span><small>Change any column</small></div>
                {comparisonModels.map((model, index) => {
                  const provider = providerFor(model)
                  const cost = estimatedTaskCost(model, workload.inputTokens, workload.outputTokens)
                  return (
                    <div className="comparison-model-card" key={`${index}-${model.id}`} style={{ '--provider': provider.accent } as CSSProperties}>
                      <div className="comparison-model-card__top"><ProviderLogo provider={provider} size="md" /><span>{provider.name}</span>{comparisonModels.length > 2 && <button type="button" onClick={() => setComparisonIds((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${model.name} from comparison`}><X aria-hidden="true" /></button>}</div>
                      <span className="select-wrap"><select value={model.id} aria-label={`Comparison model ${index + 1}`} onChange={(event) => updateComparison(index, event.target.value)}>{catalog.providers.map((optionProvider) => { const options = catalog.models.filter((option) => option.providerId === optionProvider.id); return options.length ? <optgroup label={optionProvider.name} key={optionProvider.id}>{options.map((option) => <option value={option.id} key={option.id} disabled={comparisonIds.includes(option.id) && option.id !== model.id}>{option.name}</option>)}</optgroup> : null })}</select><ChevronDown aria-hidden="true" /></span>
                      <dl><div><dt>Published</dt><dd>{model.releasedAt ? formatDate(model.releasedAt) : 'Unknown'}</dd></div><div><dt>Updated</dt><dd>{formatDate(model.reviewedAt)}</dd></div><div><dt>Avg. task</dt><dd>{cost === null ? '—' : formatTaskCost(cost)}</dd></div></dl>
                    </div>
                  )
                })}
              </div>

              <div className="comparison-matrix" role="table" aria-label="Multi-benchmark model comparison">
                {comparisonBenchmarks.map((item) => {
                  const scores = comparisonModels.flatMap((model) => { const result = getResult(model, item.id); return result ? [result.score] : [] })
                  const bestScore = scores.sort((a, b) => compareScores(a, b, item))[0]
                  return (
                    <div className="comparison-grid comparison-matrix__row" role="row" key={item.id} style={{ '--compare-count': comparisonModels.length } as CSSProperties}>
                      <button className="comparison-benchmark" type="button" role="rowheader" onClick={() => { setBenchmarkId(item.id); document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' }) }}><span className={`category-mark category-mark--${item.category}`} /><span><strong>{item.shortName}</strong><small>{item.metricLabel} · v{item.version}</small></span><ArrowUpRight aria-hidden="true" /></button>
                      {comparisonModels.map((model) => {
                        const result = getResult(model, item.id)
                        const isBest = result !== undefined && scores.length > 1 && result.score === bestScore
                        return result ? (
                          <button className={`comparison-score${isBest ? ' is-best' : ''}`} type="button" role="cell" key={model.id} onClick={() => { setBenchmarkId(item.id); setSelectedId(model.id); document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' }) }}><strong>{formatScore(result.score, item)}</strong>{isBest && <span><Trophy aria-hidden="true" /> Best</span>}</button>
                        ) : <div className="comparison-score comparison-score--missing" role="cell" key={model.id}><span>Not tested</span></div>
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="comparison-panel__foot"><Info aria-hidden="true" /><span>Results remain in their native benchmark units. “Best” respects whether higher or lower is better.</span><span>Task profile: {workload.label} · {workload.short}</span></div>
          </section>
        </section>

        <section className="value-section" id="value">
          <div className="section-shell">
            <div className="value-heading">
              <div>
                <span className="section-index section-index--light">03 / PRICE × PERFORMANCE</span>
                <h2>More capability.<br /><em>Less token tax.</em></h2>
              </div>
              <div className="value-heading__explain">
                <CircleDollarSign aria-hidden="true" />
                <p>Value combines direction-aware {benchmark.shortName} quality with a blended token cost: <strong>35% input + 65% output.</strong></p>
              </div>
            </div>

            {valueRows.length > 0 ? (
              <div className="value-grid">
                <article className="value-winner">
                  <div className="value-winner__top"><span>Best value in this cut</span><Trophy aria-hidden="true" /></div>
                  <div className="value-winner__identity"><ProviderLogo provider={valueRows[0].provider} size="xl" inverse /><div><span>{valueRows[0].provider.name}</span><h3>{valueRows[0].model.name}</h3></div></div>
                  <div className="value-winner__index"><strong>{valueRows[0].valueIndex}</strong><span>VALUE<br />INDEX</span></div>
                  <dl>
                    <div><dt>{benchmark.shortName}</dt><dd>{formatScore(valueRows[0].score, benchmark)}</dd></div>
                    <div><dt>Blended / 1M</dt><dd>{formatPrice(valueRows[0].cost)}</dd></div>
                    <div><dt>Avg. {workload.label}</dt><dd>{formatTaskCost(estimatedTaskCost(valueRows[0].model, workload.inputTokens, workload.outputTokens) ?? 0)}</dd></div>
                  </dl>
                  <button type="button" onClick={() => { setSelectedId(valueRows[0].model.id); document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' }) }}>Inspect model <ArrowUpRight aria-hidden="true" /></button>
                </article>

                <div className="value-board">
                  <div className="value-board__header"><div><span className="mini-label">Efficiency ranking</span><h3>{benchmark.name}</h3></div><span>{valueRows.length} eligible</span></div>
                  <div className="value-board__columns"><span>Model</span><span>Quality</span><span>Blended cost</span><span>Value</span></div>
                  <div className="value-board__rows">
                    {valueRows.map((row, index) => (
                      <button type="button" className="value-row" key={row.model.id} onClick={() => { setSelectedId(row.model.id); document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' }) }}>
                        <span className="value-row__model"><i>{index + 1}</i><ProviderLogo provider={row.provider} size="sm" inverse /><span><strong>{row.model.name}</strong><small>{row.provider.name}</small></span></span>
                        <span>{formatScore(row.score, benchmark)}</span>
                        <span>{formatPrice(row.cost)}</span>
                        <span className="value-row__bar"><i style={{ width: `${row.valueIndex}%` }} /><strong>{row.valueIndex}</strong></span>
                      </button>
                    ))}
                  </div>
                  <div className="value-board__note"><Info aria-hidden="true" /> Directional estimate. Your real value depends on prompt mix, caching, latency, and workload.</div>
                </div>
              </div>
            ) : (
              <div className="value-unavailable"><CircleDollarSign aria-hidden="true" /><div><h3>Value ranking unavailable for this cut</h3><p>Models need a selected-benchmark result, a defined benchmark scale, and both input and output pricing.</p></div></div>
            )}
          </div>
        </section>

        <section className="benchmark-directory section-shell" id="benchmarks">
          <div className="section-heading section-heading--compact">
            <div><span className="section-index">04 / BENCHMARKS</span><h2>Sixteen lenses.<br />No single winner.</h2></div>
            <p>The registry is data-driven. Add a benchmark to the catalog and it appears here and in the comparison control automatically.</p>
          </div>
          <div className="benchmark-groups">
            {categoryOrder.map((category) => {
              const items = catalog.benchmarks.filter((item) => item.category === category)
              if (!items.length) return null
              return (
                <article className="benchmark-group" key={category}>
                  <div className="benchmark-group__title"><span>{categoryLabels[category]}</span><b>{String(items.length).padStart(2, '0')}</b></div>
                  <div className="benchmark-group__items">
                    {items.map((item) => {
                      const count = catalog.models.filter((model) => getResult(model, item.id)).length
                      return <button type="button" onClick={() => selectFromDirectory(item.id)} key={item.id}><span><strong>{item.name}</strong><small>{item.metricLabel} · v{item.version}</small></span><span className="coverage-chip">{count} models</span><ArrowUpRight aria-hidden="true" /></button>
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="method-section" id="methodology">
          <div className="section-shell">
            <div className="method-intro">
              <span className="section-index">05 / METHOD</span>
              <h2>Transparent by<br />construction.</h2>
              <p>No scraping. No black-box database. Every score lives in one reviewable file with its source, version, variant, and review date.</p>
              <a className="button button--secondary" href="https://github.com/Daniil10295/Any-LLM-leaderboard/blob/main/data/catalog.json" target="_blank" rel="noreferrer"><FileCode2 aria-hidden="true" /> View data file</a>
            </div>
            <div className="method-steps">
              <article><span className="method-step__number">01</span><div className="method-step__icon"><BookOpen aria-hidden="true" /></div><h3>Record the source</h3><p>Every result points to a source and names the benchmark version. Native scores remain untouched.</p></article>
              <article><span className="method-step__number">02</span><div className="method-step__icon"><ShieldCheck aria-hidden="true" /></div><h3>Validate the catalog</h3><p>The local script rejects duplicate IDs, bad ranges, malformed URLs, and unknown benchmark references.</p></article>
              <article><span className="method-step__number">03</span><div className="method-step__icon"><Zap aria-hidden="true" /></div><h3>Render only facts</h3><p>No published result means no tower and no rank. Missing data is never estimated or silently turned into zero.</p></article>
            </div>
            <div className="catalog-callout">
              <div><Database aria-hidden="true" /><span><strong>One canonical catalog</strong><small>Static, source-controlled, LLM-friendly</small></span></div>
              <code>npm run model:add -- --file ./new-model.json</code>
              <span className="catalog-callout__check"><Check aria-hidden="true" /> Validated at build</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-shell site-footer__top">
          <div className="footer-brand"><span className="brand__mark brand__mark--light"><span>A</span><i>/</i><span>B</span></span><div><strong>ANY / BENCH</strong><span>Independent AI model comparison</span></div></div>
          <p>Built for better model decisions,<br />not better launch slides.</p>
          <div className="footer-links"><a href="#compare">Leaderboard</a><a href="#comparison">Compare</a><a href="#value">Value</a><a href="#benchmarks">Benchmarks</a><a href="#methodology">Method</a></div>
        </div>
        <div className="section-shell site-footer__bottom">
          <span>Catalog v{catalog.version} · Updated {catalog.updatedAt}</span>
          <span>Source-reported snapshots. Verify before production decisions.</span>
          <a href="#top">Back to top <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </footer>
    </div>
  )
}

export default App
