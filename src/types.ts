export type BenchmarkCategory =
  | 'general'
  | 'math-science'
  | 'coding'
  | 'agents-tools'
  | 'search-browsing'
  | 'multimodal'
  | 'other'

export type Provider = {
  id: string
  name: string
  logoKey?: string
  accent: string
  websiteUrl: string
}

export type Benchmark = {
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

export type BenchmarkResult = {
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

export type Model = {
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

export type Catalog = {
  version: string
  updatedAt: string
  providers: Provider[]
  benchmarks: Benchmark[]
  models: Model[]
}
