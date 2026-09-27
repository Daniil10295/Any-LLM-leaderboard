# Any / Bench

A responsive, one-page AI model leaderboard for comparing benchmark performance, API pricing, and price-to-performance across providers.

The public app is fully static and read-only. Models and benchmark results are maintained manually in one source-controlled catalog, making updates easy to review and safe for a small coding LLM to perform.

## Features

- Vertical **Towers** chart with provider logos and a shared benchmark scale.
- Sortable **List** view with scores, pricing, and context windows.
- 22 manually curated models from 13 providers, reviewed through September 27, 2026.
- 137 sourced result rows across 16 registered benchmarks covering reasoning, math, coding, agents, automation, tool use, and browsing.
- Sparse-result behavior: models without a selected benchmark result are not displayed or ranked.
- Search plus provider, access type, release date, minimum context, input price, and estimated cost-per-task filters.
- Explicit side-by-side comparison matrix for up to four models across multiple benchmarks.
- Publication and catalog-update dates in model details and list rankings.
- Dedicated price/performance section using a documented blended-cost formula.
- Model detail cards with pricing, coverage, source links, and review dates.
- Responsive desktop, tablet, and mobile layouts.
- Static catalog validation with no database, scraping, user accounts, or cloud synchronization.

## Stack

- Vite
- React
- TypeScript
- Lucide and React Icons
- Plain responsive CSS

## Local development

```bash
npm install
npm run dev
```

The development server binds to `0.0.0.0` for local and hosted-preview use.

## Quality commands

```bash
npm run data:validate
npm run typecheck
npm run lint
npm run build
```

The production build always validates the catalog first.

## Data architecture

All public data is stored in [`data/catalog.json`](data/catalog.json):

```text
catalog
├── providers[]
├── benchmarks[]
└── models[]
    └── results[]
```

A result exists only when a model has a recorded score for that benchmark. Missing results must be omitted from the model's `results` array—never entered as zero or estimated from another benchmark.

Each model also records its publication date, catalog review/update date, access type, context window, and token prices. The interface uses these fields for time tracking and advanced filters. Average cost per task is calculated locally from the chosen workload profile; it is not stored as an independent fact.

Each benchmark declares its:

- Stable ID and display names
- Category and description
- Metric, unit, and ranking direction
- Optional normalization scale
- Version and source URL

Each result declares its:

- Benchmark ID
- Native score
- Benchmark version
- Source URL and review date
- Optional model variant, harness, evaluation date, and notes

See [`PLAN.md`](PLAN.md) for the complete product and data specification.

## Add a model manually

The simplest workflow is to add one model object to `data/catalog.json`, then run:

```bash
npm run data:validate
npm run build
```

The validator checks IDs, provider references, benchmark references, duplicate results, score ranges, prices, dates, and URLs.

### Add a model with the helper

Prepare a JSON file containing one complete model record, then run:

```bash
npm run model:add -- --file ./new-model.json
```

The helper rejects duplicate IDs, validates the resulting catalog, updates the catalog date, and formats the file. It does not contact external services.

### Add a benchmark with the helper

Prepare one benchmark record, then run:

```bash
npm run benchmark:add -- --file ./new-benchmark.json
```

After registering the benchmark, result records can reference its ID. The UI discovers registered benchmarks automatically; no component changes are required.

## Price/performance formula

```text
Blended cost = (input price × 0.35) + (output price × 0.65)
Quality index = selected score normalized to 0–100 using benchmark direction and scale
Raw value = quality index ÷ blended cost
Value index = raw value normalized against the highest eligible visible result
```

A model needs an explicit selected-benchmark result and both token prices to enter the value ranking. A benchmark without a declared normalization scale remains usable in the regular leaderboard but is excluded from value calculations.

### Average cost per task

The advanced filter offers three transparent workload profiles:

- **Quick turn:** 2,000 input tokens + 500 output tokens
- **Standard task:** 6,000 input tokens + 1,500 output tokens
- **Agent run:** 30,000 input tokens + 8,000 output tokens

```text
Average task cost = (input price × input tokens + output price × output tokens) ÷ 1,000,000
```

Changing the profile recalculates displayed task costs and the maximum task-cost filter immediately.

## Data notice

The included catalog is a curated, provisional starter dataset assembled from linked public sources. Benchmark versions, harnesses, reasoning settings, and provider-reported results may not be directly comparable. Verify source records before making production or purchasing decisions.
