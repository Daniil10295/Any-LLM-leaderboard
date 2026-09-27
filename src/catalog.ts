import catalogJson from '../data/catalog.json'
import type { Benchmark, BenchmarkCategory, BenchmarkResult, Catalog, Model } from './types'

export const catalog = catalogJson as Catalog

export const categoryLabels: Record<BenchmarkCategory, string> = {
  general: 'General reasoning',
  'math-science': 'Math & abstract reasoning',
  coding: 'Software engineering',
  'agents-tools': 'Agents & tool use',
  'search-browsing': 'Search & browsing',
  multimodal: 'Multimodal',
  other: 'Other',
}

export const categoryOrder: BenchmarkCategory[] = [
  'general',
  'math-science',
  'coding',
  'agents-tools',
  'search-browsing',
  'multimodal',
  'other',
]

export function getResult(model: Model, benchmarkId: string): BenchmarkResult | undefined {
  return model.results.find((result) => result.benchmarkId === benchmarkId)
}

export function formatScore(score: number, benchmark: Benchmark): string {
  if (benchmark.unit === 'percent') return `${score.toFixed(score % 1 === 0 ? 0 : 1)}%`
  if (benchmark.unit === 'usd') return `$${score.toFixed(2)}`
  if (benchmark.unit === 'seconds') return `${score.toFixed(1)}s`
  return score.toFixed(score % 1 === 0 ? 0 : 1)
}

export function normalizedQuality(score: number, benchmark: Benchmark): number | null {
  if (!benchmark.scale) return null
  const range = benchmark.scale.max - benchmark.scale.min
  const ratio = benchmark.direction === 'higher-is-better'
    ? (score - benchmark.scale.min) / range
    : (benchmark.scale.max - score) / range
  return Math.max(0, Math.min(100, ratio * 100))
}

export function compareScores(a: number, b: number, benchmark: Benchmark): number {
  return benchmark.direction === 'higher-is-better' ? b - a : a - b
}

export function blendedPrice(model: Model): number | null {
  if (model.inputPrice === undefined || model.outputPrice === undefined) return null
  return model.inputPrice * 0.35 + model.outputPrice * 0.65
}

export function formatPrice(value: number): string {
  if (value < 1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`
}

export function formatContext(value?: number): string {
  if (!value) return '—'
  if (value >= 1_000_000) return `${value / 1_000_000}M`
  return `${Math.round(value / 1000)}K`
}

export function estimatedTaskCost(model: Model, inputTokens: number, outputTokens: number): number | null {
  if (model.inputPrice === undefined || model.outputPrice === undefined) return null
  return (model.inputPrice * inputTokens + model.outputPrice * outputTokens) / 1_000_000
}

export function formatTaskCost(value: number): string {
  if (value < 0.01) return `$${value.toFixed(4)}`
  if (value < 1) return `$${value.toFixed(3)}`
  return `$${value.toFixed(2)}`
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

export function formatMonth(value?: string): string {
  if (!value) return 'Unknown'
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`))
}
