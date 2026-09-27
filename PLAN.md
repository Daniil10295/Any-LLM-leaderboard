# Any LLM Leaderboard — Product & Implementation Specification

> **Document status:** Draft — awaiting approval  
> **Implementation status:** Not started  
> **Project type:** Responsive one-page web application

## Status marks

- `[ ]` Planned
- `[>]` In progress
- `[x]` Complete
- `[!]` Requires a product decision
- **P0** Required for the first release
- **P1** Valuable follow-up if time permits

---

## 1. Product vision

Create a clear, independent comparison board where users can compare AI models from different providers using benchmark quality, token pricing, and price-to-performance—not just whichever metric a provider highlights at launch.

The first release will be a polished one-page application backed by a small, source-controlled data catalog. A maintainer—or a small coding LLM—can add a model by editing one structured file or running a validation script; the public website remains read-only.

### Core promise

**“One board. Every model. Quality and cost in the same view.”**

### Primary goals

1. Make cross-provider benchmark differences understandable at a glance.
2. Support a broad, extensible benchmark catalog instead of a fixed set of five scores.
3. Offer both a visual chart and a precise list for different comparison styles.
4. Treat pricing as a first-class comparison dimension.
5. Never invent missing results: a model without a result for the selected benchmark is not ranked or drawn.
6. Make model and benchmark updates simple, manual, reviewable, and safe for a small coding LLM to perform.
7. Keep the public website static: no public accounts, cloud services, or runtime database.

### Out of scope for the first release

- Public user accounts, sign-up, profiles, or cloud synchronization.
- A hosted database or cloud content-management system.
- Browser-based model creation or personal model collections.
- Automated benchmark scraping or scheduled data ingestion.
- Live provider API calls.
- Community voting or comments.
- Currency conversion and regional pricing.

### Administration policy

- The first release has **no authentication layer** because the site and catalog are static.
- The repository and deployment permissions are the administration mechanism.
- If an in-browser management interface is required later, it may support **one administrator account only**—never public registration or multi-user roles.
- A future administrator login must use a real server-side session and secret storage; a password embedded in frontend code is not acceptable.
- This optional administrator capability is not part of the initial implementation unless explicitly requested later.

---

## 2. Target users and jobs to be done

### Primary users

- Developers selecting a model for an application.
- AI product teams comparing capability against operating cost.
- Researchers and enthusiasts tracking model releases.
- Buyers who need a quick, non-provider-specific overview.
- Repository maintainers who curate benchmark and pricing data.
- Small coding LLMs tasked with adding or updating a model through a constrained file/script workflow.

### Core user stories

- **US-01:** As a developer, I want to compare models on coding performance so I can shortlist an API.
- **US-02:** As a buyer, I want to set a maximum input-token price so I only see affordable options.
- **US-03:** As a visual user, I want a vertical tower chart so differences are immediately visible.
- **US-04:** As an analytical user, I want a sortable list so I can inspect exact values.
- **US-05:** As a cost-conscious user, I want a dedicated value ranking that combines benchmark scores and price.
- **US-06:** As a maintainer, I want to add a newly released model by changing one documented data file.
- **US-07:** As a small coding LLM, I want a schema and validation command so I can make a narrow, verifiable model-data update.
- **US-08:** As an administrator, I want all catalog changes reviewed through normal source control and deployment rather than a cloud dashboard.
- **US-09:** As a user, when I select DeepSWE or another sparsely reported benchmark, I want to see only models with a real published result for that benchmark.
- **US-10:** As a user, I want benchmarks grouped by capability so I can quickly move between general reasoning, coding, agents, tool use, and other categories.

---

## 3. One-page information architecture

The page will be organized into the following sections in this order.

### Section A — Sticky header

- Product mark and name: **Any / Bench**.
- Anchor navigation: Compare, Value, Methodology.
- Visible dataset version or last-updated marker.
- Compact mobile navigation.

### Section B — Hero and dataset summary

- Short value proposition and supporting copy.
- Primary action that scrolls to the leaderboard.
- Secondary action that scrolls to the methodology and sources.
- Dataset summary: number of models, providers, and supported benchmarks.
- Small note identifying all values as a manually curated comparison dataset.

### Section C — Comparison control bar

- Search by model or provider.
- Provider selector.
- Searchable benchmark selector grouped by capability category.
- Benchmark metadata summary: metric, version, result count, and source.
- Maximum input-price filter.
- Two-way view switch:
  1. **Towers** — vertical graph.
  2. **List** — structured rows.
- Active result count and reset action.

### Section D — Main benchmark explorer

#### D1. Tower view

- Vertical bars sorted using the selected benchmark's score direction.
- For lower-is-better metrics, tower height represents direction-aware performance while the label preserves the native result.
- Only models with an explicit result for the selected benchmark are rendered.
- Score displayed directly on every tower using the benchmark's native unit.
- Provider logo attached to every tower.
- Model and provider labels below each tower.
- Horizontal scale lines for visual context.
- Horizontal scrolling on small screens rather than unreadably narrow bars.
- Selecting a tower opens or updates its detail panel.

#### D2. List view

- Rank, provider logo, model, selected score, input price, output price, and context size.
- Only models with an explicit result for the selected benchmark appear.
- Sort by score, price, or price-to-performance, respecting whether higher or lower is better.
- Responsive reduction of secondary columns on mobile.
- Selecting a row opens or updates the same detail panel.

#### D3. Model detail panel

- Provider logo and model identity.
- All available benchmark results grouped by category.
- Missing benchmarks are omitted from the result list rather than displayed as zero.
- Input and output token pricing.
- Context-window size.
- Data-status badge such as “Verified” or “Provisional”.
- Source/reference link and last-reviewed date.
- No visitor-facing edit or remove controls.

#### D4. Multi-model comparison matrix

- Two to four models can be selected explicitly.
- Multiple benchmark rows are visible at the same time.
- Rows can be filtered by benchmark category.
- Best available score is highlighted using the benchmark's score direction.
- Missing model/benchmark pairs show “Not tested” and are never converted to zero.
- Model headers show publication date, data-update date, and estimated average task cost.

### Section E — Price / performance bench

A separate section focused on economic value rather than raw capability.

- Ranked value table using the currently selected benchmark.
- Models must have both a real result for that benchmark and valid pricing to qualify.
- Provider logos displayed in the ranking.
- Blended token cost shown beside benchmark quality.
- Value index normalized to a simple 0–100 scale.
- Explanation of the formula and assumptions.
- Highlight card for the current value leader.
- Existing search, provider, and price filters also apply here.

**Initial formula:**

```text
Blended cost = (input price × 0.35) + (output price × 0.65)
Quality index = selected result normalized to 0–100 using the benchmark scale and score direction
Raw value = quality index ÷ blended cost
Value index = raw value normalized against the highest eligible result
```

The interface will clearly state that this is a directional comparison, not a workload-specific cost forecast. If a benchmark lacks a defensible normalization scale, its raw leaderboard remains available but its price/performance ranking is disabled rather than guessed.

### Section F — Manual catalog maintenance (repository workflow)

This is a maintainer workflow, not a public page section or visitor-facing form.

#### Canonical data file

- The benchmark registry, models, and sparse result records live in one human-readable, source-controlled file, proposed as `data/catalog.json`.
- The file has three explicit collections: `benchmarks`, `providers`, and `models`.
- Every model contains only the benchmark results actually published for it; absent results are not generated or filled with zero.
- The file uses a documented, stable schema with examples for adding a benchmark, provider, model, and result.
- Records are intentionally self-contained so a small LLM can add a model without navigating application components.
- A model update normally changes one model object and the top-level catalog update date only.

#### Validation and helper script

- `npm run data:validate` checks the full catalog without modifying files.
- `npm run model:add -- --file path/to/model.json` validates one prepared model and its available results, rejects duplicate IDs, inserts it into the canonical catalog, and formats the result.
- `npm run benchmark:add -- --file path/to/benchmark.json` registers a new benchmark before model results reference it.
- The scripts return concise, actionable errors with the exact field and record that failed.
- Neither command contacts external services or scrapes data.
- A small LLM can complete the workflow by reading the schema, preparing one record, running validation, and reviewing the generated diff.

#### Review and publication

1. Maintainer or coding LLM edits the model data or runs the helper script.
2. Validation checks schema, ranges, unique IDs, URLs, pricing, and required citations.
3. Build-time tests confirm the new model can be ranked in every applicable view for which it has explicit results.
4. The resulting source-control diff is reviewed.
5. The static site is rebuilt and deployed through the repository's existing deployment process.

There is no runtime database, cloud write API, browser local storage, or automatic ingestion.

### Section G — Methodology and data notice

- Explain benchmark-native metrics and when normalization is used.
- Publish the missing-result rule: no result means omitted, never zero or estimated.
- Explain the value formula.
- Display benchmark version, result count, source, and catalog last-updated marker.
- State that prices and benchmarks change over time.
- Separate factual source/reference links from application-calculated metrics.

### Section H — Footer

- Short product statement.
- Links back to Compare, Value, and Methodology.
- Repository link if appropriate.
- Dataset disclaimer.

---

## 4. Functional requirements

| ID | Priority | Requirement | Acceptance criterion |
|---|---|---|---|
| FR-001 | P0 | Show models from multiple providers | At least six providers are represented in starter data. |
| FR-002 | P0 | Select from an extensible benchmark registry | At least 15 benchmarks across multiple categories are available, including AutomationBench, DeepSWE, and Agent's Last Exam; every visible score and ranking updates to the selection. |
| FR-003 | P0 | Search models and providers | Results update immediately and matching is case-insensitive. |
| FR-004 | P0 | Filter by provider | The chart, list, count, details, and value bench stay synchronized. |
| FR-005 | P0 | Filter by maximum price | Models above the selected input-price ceiling are excluded everywhere. |
| FR-006 | P0 | Switch between tower and list views | Switching does not reset filters or the selected benchmark. |
| FR-007 | P0 | Display logos in data views | Every known provider has a recognizable logo on towers and list rows. |
| FR-008 | P0 | Inspect model details | Selecting a tower or row exposes complete benchmark and pricing details. |
| FR-009 | P0 | Show price/performance ranking | Visible models are ranked using the documented formula. |
| FR-010 | P0 | Load a file-based catalog | Every model displayed by the site is generated from the canonical repository data file. |
| FR-011 | P0 | Validate catalog data | One command reports duplicate IDs, missing fields, invalid ranges, malformed URLs, invalid prices, and unknown benchmark references. |
| FR-012 | P0 | Add a model by script or direct edit | A maintainer or small LLM can add one valid record without modifying UI source files. |
| FR-013 | P0 | Handle empty results | A helpful empty state and one-click reset are shown. |
| FR-014 | P0 | Responsive layout | All workflows remain usable from 320 px mobile width through desktop. |
| FR-015 | P0 | Accessible interaction | All controls work with keyboard navigation and have visible focus states. |
| FR-016 | P1 | Share current comparison | Filters can be encoded into a shareable URL. |
| FR-017 | P1 | Export comparison | Visitors can download visible results as CSV. |
| FR-018 | P0 | Remain static and read-only | The public application makes no authenticated, database, cloud-sync, or write-API requests. |
| FR-019 | P0 | Preserve source traceability | Each benchmark result includes a source URL, benchmark version or variant, and review date. |
| FR-020 | P0 | Enforce sparse benchmark coverage | A model without an explicit result for the selected benchmark is absent from its tower chart, list ranking, and value ranking. |
| FR-021 | P0 | Group benchmarks by capability | The selector separates general reasoning, math/science, coding, agents/tool use, and other registered categories. |
| FR-022 | P0 | Respect benchmark direction and units | Rankings correctly handle higher-is-better and lower-is-better metrics and display native units. |
| FR-023 | P0 | Compare multiple models across benchmarks | Users can place two to four models in a side-by-side matrix and view multiple benchmark rows simultaneously. |
| FR-024 | P0 | Track model time metadata | Publication and catalog-update dates are visible and models can be sorted or filtered by publication date. |
| FR-025 | P0 | Apply advanced model filters | Users can filter by access type, minimum context, publication date, and average cost per task. |
| FR-026 | P0 | Estimate task cost transparently | Task cost uses a visible workload profile and is derived from input/output token prices rather than stored as an unsupported fact. |

---

## 5. Data and benchmark specification

### Why results must be sparse

Benchmark coverage is not uniform. A newly released model may have an AutomationBench result but no DeepSWE result, while another may have the reverse. The catalog must represent this truth directly:

- Missing means **not evaluated or not recorded**, not a score of zero.
- No score is inferred from related benchmarks.
- When a benchmark is selected, only models with a matching result record are eligible.
- The interface displays `N models with results` for the active benchmark.
- If no tracked model has a result, the page shows a benchmark-specific empty state rather than fallback data.

### Initial benchmark registry

The architecture is not limited to this list. The first catalog will target at least 15 well-sourced benchmarks. AutomationBench, DeepSWE, and Agent's Last Exam are explicit P0 requirements. Sparse coverage is expected and supported.

| Category | Planned initial benchmarks |
|---|---|
| General knowledge and reasoning | MMLU-Pro, GPQA Diamond, Humanity's Last Exam, LiveBench |
| Mathematics and abstract reasoning | AIME, ARC-AGI-2 |
| Software engineering and coding | SWE-bench Verified, SWE-bench Pro, LiveCodeBench, DeepSWE, Terminal-Bench |
| Agents, tools, and automation | AutomationBench, Agent's Last Exam, BFCL, tau-bench |
| Search and browsing | BrowseComp |

Exact versions and result values will be entered only when a reliable source is recorded. Benchmark names are not hard-coded into UI components; adding a valid registry record makes a new benchmark available automatically.

### Catalog structure

```ts
type BenchmarkCategory =
  | 'general'
  | 'math-science'
  | 'coding'
  | 'agents-tools'
  | 'search-browsing'
  | 'multimodal'
  | 'other'

type Provider = {
  id: string
  name: string
  logoKey?: string
  websiteUrl: string
}

type Benchmark = {
  id: string
  name: string
  shortName: string
  category: BenchmarkCategory
  description: string
  metricLabel: string
  unit: 'percent' | 'score' | 'seconds' | 'usd' | 'custom'
  direction: 'higher-is-better' | 'lower-is-better'
  scale?: { min: number; max: number }
  version: string
  sourceUrl: string
}

type BenchmarkResult = {
  benchmarkId: string
  score: number
  sourceUrl: string
  evaluatedAt?: string
  reviewedAt: string
  benchmarkVersion: string
  modelVariant?: string
  harness?: string
  notes?: string
}

type Model = {
  id: string
  name: string
  providerId: string
  description?: string
  inputPrice?: number
  outputPrice?: number
  contextWindow?: number
  releasedAt?: string
  sourceUrls: string[]
  access: 'closed' | 'open-weights'
  status: 'verified' | 'provisional'
  reviewedAt: string
  results: BenchmarkResult[]
}
```

### Catalog example

```json
{
  "version": "1.0.0",
  "updatedAt": "2026-09-27",
  "providers": [
    {
      "id": "example-provider",
      "name": "Example Provider",
      "websiteUrl": "https://example.com"
    }
  ],
  "benchmarks": [
    {
      "id": "deepswe",
      "name": "DeepSWE",
      "shortName": "DeepSWE",
      "category": "coding",
      "description": "Long-horizon software engineering evaluation.",
      "metricLabel": "Pass@1",
      "unit": "percent",
      "direction": "higher-is-better",
      "scale": { "min": 0, "max": 100 },
      "version": "1.x",
      "sourceUrl": "https://deepswe.lol/"
    }
  ],
  "models": [
    {
      "id": "example-model",
      "name": "Example Model",
      "providerId": "example-provider",
      "inputPrice": 1.0,
      "outputPrice": 4.0,
      "contextWindow": 128000,
      "sourceUrls": ["https://example.com/model-card"],
      "access": "closed",
      "status": "provisional",
      "reviewedAt": "2026-09-27",
      "results": [
        {
          "benchmarkId": "deepswe",
          "score": 42.5,
          "sourceUrl": "https://example.com/model-card#benchmarks",
          "reviewedAt": "2026-09-27",
          "benchmarkVersion": "1.x"
        }
      ]
    }
  ]
}
```

This example model appears in DeepSWE. It does not appear in AutomationBench unless an explicit AutomationBench result is added to its `results` array.

### Data rules

- Benchmark records define labels, categories, units, score direction, versions, official sources, and—when defensible—a fixed normalization scale.
- Result records reference benchmark IDs; dangling references fail validation.
- Duplicate results for the same model, benchmark, version, and model variant fail validation.
- Native result values are stored without silently converting scales.
- Direction-aware display values are calculated only from registry metadata: higher-is-better uses `(score − min) / (max − min)`; lower-is-better reverses that scale.
- A benchmark without a declared scale can be ranked natively but is excluded from composite and value calculations.
- Price values represent USD per one million tokens and may be absent if no comparable API price exists.
- Missing benchmark, price, or context values remain absent and display as unavailable where appropriate.
- Invalid, negative, out-of-range, or non-numeric values fail catalog validation.
- Unknown provider names receive a generated monogram if no known logo exists.
- Every result includes a review date and direct source URL.
- Model IDs and benchmark IDs must be stable, URL-safe, and unique.
- The application imports the catalog at build time and performs no runtime data writes.
- Data changes are visible as focused source-control diffs.

### Composite and overall scores

- Individual benchmark pages always use the source result directly.
- Missing results are never imputed for an overall score.
- If an Any/Bench composite is included, it must define a versioned set of required benchmarks and minimum coverage.
- Every composite value displays its coverage, for example `8/10 benchmarks`.
- Models below the published coverage threshold are not ranked in the composite.
- Changing the composite formula or benchmark set requires a new formula version.

### Logo strategy

- Known providers use locally bundled brand icons from a maintained icon library or official source.
- Logos are rendered directly inside graph and ranking elements.
- Unknown providers use a consistent initial-based fallback mark.
- No logo is fetched from a third-party server at runtime.

---

## 6. Visual and interaction specification

### Design direction

- Editorial, technical, and calm rather than a generic dashboard aesthetic.
- Warm neutral page background with deep navy text and a focused lime accent.
- Provider-specific colors reserved for chart data and logos.
- Strong typography, clear hierarchy, restrained borders, and limited corner rounding.
- No decorative gradients or unnecessary glass effects.
- Motion limited to useful transitions, with reduced-motion support.

### Responsive behavior

- **Desktop:** chart and model detail panel can sit side by side.
- **Tablet:** controls wrap into two rows; detail panel moves beneath the chart if needed.
- **Mobile:** controls stack; tower chart scrolls horizontally; list hides low-priority columns.

### Key interaction rules

- The selected view, benchmark, and filters remain stable while inspecting models.
- Changing a benchmark recalculates the eligible model set from explicit result records only.
- Changing a filter never leaves an invalid selected model visible.
- Buttons provide hover, active, focus, and disabled states.
- Resetting filters changes only the current view and never changes catalog data.
- The public interface exposes no data mutation controls.

---

## 7. KPIs and quality marks

### Product usability KPIs

| KPI | Target | Validation method |
|---|---:|---|
| Time to compare two models | Under 30 seconds | Manual usability walkthrough |
| View-switch success | 100% without losing filters | Interaction test |
| Manual model addition | Under 5 minutes for a maintainer following the guide | Timed repository workflow |
| Small-LLM edit scope | One data record plus generated formatting only | Source-control diff review |
| Invalid catalog detection | 100% of defined schema violations rejected | Automated fixture tests |
| Filter consistency | 100% across chart, list, details, and value section | Automated/manual checks |
| Missing-result exclusion | 100%; no absent result is rendered or ranked | Sparse-data fixture tests |
| Benchmark extensibility | New valid benchmark appears without UI code changes | Catalog integration test |

### Technical KPIs

| KPI | Target |
|---|---:|
| TypeScript errors | 0 |
| ESLint errors | 0 |
| Production build errors | 0 |
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse Best Practices | 90+ |
| Cumulative Layout Shift | Below 0.10 |
| Largest Contentful Paint | Below 2.5 seconds on a typical broadband profile |
| Keyboard-completable core workflows | 100% |
| Critical console errors | 0 |

### Visual quality marks

- `[ ]` Clear hierarchy at desktop, tablet, and mobile sizes.
- `[ ]` Provider logos remain legible on all chart colors.
- `[ ]` Towers have a shared baseline and meaningful scale.
- `[ ]` Empty, loading, validation, selected, and hover states are designed.
- `[ ]` Price and benchmark units are never ambiguous.
- `[ ]` Active benchmark name, version, metric, and eligible model count are visible.
- `[ ]` Sparse benchmarks never show zero-value placeholder towers.
- `[ ]` No horizontal page overflow at 320 px; only the graph itself may scroll.

---

## 8. Spec-Driven Development workflow

Implementation will proceed only after this specification is approved. Each milestone has an explicit exit gate.

### M0 — Specification approval

**Status:** `[x]` Approved

Deliverables:

- `[x]` Review the repository README.
- `[x]` Create `.gitignore`.
- `[x]` Define product scope, sections, requirements, KPIs, and data model.
- `[ ]` Receive approval or requested revisions.

**Exit gate:** User explicitly approves the plan.

### M1 — Foundation and design tokens

**Status:** `[ ]` Planned

Deliverables:

- React + TypeScript + Vite scaffold.
- Typography, color, spacing, and responsive tokens.
- Semantic page structure for all planned sections.
- Build-time catalog loader, dynamic benchmark registry, and provider-logo mapping.

**Exit gate:** App builds successfully and the page skeleton works at mobile and desktop sizes.

### M2 — Benchmark explorer

**Status:** `[ ]` Planned

Deliverables:

- Shared filters and search.
- Grouped, data-driven benchmark selection with result counts.
- Eligibility filtering that excludes models with no selected-benchmark result.
- Vertical tower chart with provider logos.
- Sortable list view with provider logos.
- Synchronized model detail panel.
- Empty and reset states.

**Exit gate:** FR-001 through FR-008, FR-013, and FR-020 through FR-022 pass sparse-data and manual acceptance checks.

### M3 — Price/performance bench

**Status:** `[ ]` Planned

Deliverables:

- Blended-cost calculation.
- Normalized value ranking.
- Current value-leader summary.
- Formula explanation and units.

**Exit gate:** FR-009 produces deterministic results and responds to every shared filter.

### M4 — Manual catalog pipeline

**Status:** `[ ]` Planned

Deliverables:

- Canonical `data/catalog.json` with benchmark registry, providers, models, and sparse results.
- Validation command with record- and field-specific errors.
- Optional add-model and add-benchmark helpers for prepared JSON records.
- Duplicate-ID, benchmark-reference, result-uniqueness, unit/range, price, date, and source-URL checks.
- Maintainer instructions with minimal benchmark, model, and result examples.
- Build-time import with no runtime data service.

**Exit gate:** FR-010 through FR-012, FR-018, and FR-019 pass direct-edit, script-add, invalid-input, build, and network checks.

### M5 — Responsive polish and accessibility

**Status:** `[ ]` Planned

Deliverables:

- Mobile, tablet, and desktop refinements.
- Keyboard and focus behavior.
- Reduced-motion handling.
- Methodology, data notice, and final footer.
- Final visual state review.

**Exit gate:** FR-014 and FR-015 pass; visual quality marks are complete.

### M6 — Verification and handoff

**Status:** `[ ]` Planned

Deliverables:

- Lint, type-check, and production build.
- Browser verification of critical workflows.
- Lighthouse-oriented performance review.
- README update with setup and usage instructions.
- Final implementation summary.

**Exit gate:** All P0 requirements and technical KPIs pass, or any exception is explicitly documented.

---

## 9. Acceptance scenarios

### Scenario A — Compare coding ability visually

1. User opens the page.
2. User selects the Coding benchmark.
3. User keeps Towers selected.
4. Towers reorder by coding score and display provider logos.
5. User selects a tower and sees all details for that model.

**Pass condition:** Scores, ranking, selected details, and labels agree.

### Scenario B — Find an affordable model

1. User sets the maximum input price.
2. Expensive models disappear from both leaderboard views.
3. The value section updates to the same filtered model set.
4. User switches to List without losing the price filter.

**Pass condition:** No model above the price ceiling appears anywhere.

### Scenario C — Add a newly released model manually

1. Maintainer or small coding LLM reads the catalog schema and example.
2. It prepares one model record with provider, pricing, context, only the available benchmark results, sources, and review dates.
3. It edits the canonical catalog directly or runs the add-model helper.
4. It runs catalog validation and the production build.
5. It reviews a focused source-control diff and publishes the static build.

**Pass condition:** Validation succeeds, only intended catalog files change, and the model appears correctly only in benchmark views for which it has explicit results.

### Scenario D — Select a sparsely reported benchmark

1. User selects DeepSWE, AutomationBench, or another benchmark with partial model coverage.
2. The app resolves eligible models from explicit result records.
3. Models without that result are omitted from towers, list rows, and value rankings.
4. The result count and benchmark metadata update.

**Pass condition:** No omitted model is represented as zero, unavailable, estimated, or ranked; it is simply absent from that benchmark comparison.

### Scenario E — Recover from no results

1. User applies a search/provider/price combination with no matches.
2. A clear empty state appears.
3. User activates Reset filters.

**Pass condition:** The full starter dataset returns in one action.

---

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Benchmark values from different sources are not directly comparable | Normalize values, show methodology, date records, and label the starter dataset clearly. |
| Provider pricing changes frequently | Store update dates and source URLs; make manual editing straightforward. |
| Price/performance can imply false precision | Publish the formula and call the value index directional rather than absolute. |
| Many models make a vertical chart crowded | Sort results, preserve horizontal scrolling, and provide the list alternative. |
| New provider has no available logo | Generate a consistent monogram fallback and allow a later reviewed logo-map update. |
| A small LLM edits application logic accidentally | Keep catalog/schema/docs isolated, provide a helper script, and require a focused diff review. |
| A malformed manual update breaks the site | Run schema validation before build and reject incomplete, duplicate, or dangling benchmark/result records. |
| Missing results are mistaken for poor scores | Store sparse results and omit unbenchmarked models entirely for the active benchmark. |
| Benchmarks use incompatible units or directions | Keep unit and direction in registry metadata and rank each benchmark using its own definition. |
| A frontend-only admin password would be insecure | Ship no admin login in the static release; require real server-side authentication if that scope is added later. |

---

## 11. Definition of done

The first release is complete when:

- `[ ]` All P0 functional requirements pass.
- `[ ]` Both Towers and List views are fully usable across at least 15 registered benchmarks.
- `[ ]` Models without the selected benchmark result are excluded everywhere that benchmark is ranked.
- `[ ]` Logos appear on chart towers and list/value rows.
- `[ ]` The price/performance section uses and explains a deterministic formula.
- `[ ]` A model with any subset of benchmark results can be added through one catalog edit or the helper script without changing UI code.
- `[ ]` A benchmark can be registered without changing UI components.
- `[ ]` Invalid catalog changes, including unknown benchmark references, fail with actionable validation errors.
- `[ ]` The public site contains no accounts, cloud storage, write API, scraping job, or visitor-facing editor.
- `[ ]` Mobile and keyboard workflows are verified.
- `[ ]` Lint, type-check, and production build pass with no errors.
- `[ ]` README includes local setup, commands, data notes, and feature documentation.
- `[ ]` Final result is presented in a working live preview.

---

## 12. Approval checkpoint

No implementation work begins until this document is approved.

**Decision requested:**

- `[ ]` Approve the specification as written.
- `[ ]` Approve with requested changes.
- `[ ]` Revise scope before implementation.
mplementation.
