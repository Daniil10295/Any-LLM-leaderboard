import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const catalogPath = path.join(root, 'data', 'catalog.json')

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const CATEGORIES = new Set(['general', 'math-science', 'coding', 'agents-tools', 'search-browsing', 'multimodal', 'other'])
const UNITS = new Set(['percent', 'score', 'seconds', 'usd', 'custom'])
const DIRECTIONS = new Set(['higher-is-better', 'lower-is-better'])

export function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Could not read valid JSON from ${path.relative(root, filePath)}: ${error.message}`)
  }
}

export function writeCatalog(catalog) {
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`)
}

function isUrl(value) {
  if (typeof value !== 'string') return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function requiredString(value, label, errors) {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${label} must be a non-empty string`)
}

function validId(value, label, errors) {
  requiredString(value, label, errors)
  if (typeof value === 'string' && !ID_PATTERN.test(value)) {
    errors.push(`${label} must be URL-safe kebab-case`)
  }
}

function validDate(value, label, errors, optional = false) {
  if (optional && value === undefined) return
  if (typeof value !== 'string' || !DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${label} must be a valid YYYY-MM-DD date`)
  }
}

function uniqueIds(records, type, errors) {
  const seen = new Set()
  for (const record of records) {
    if (seen.has(record.id)) errors.push(`${type} has duplicate id "${record.id}"`)
    seen.add(record.id)
  }
}

export function validateCatalog(catalog) {
  const errors = []
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) return ['catalog must be a JSON object']

  requiredString(catalog.version, 'catalog.version', errors)
  validDate(catalog.updatedAt, 'catalog.updatedAt', errors)

  for (const collection of ['providers', 'benchmarks', 'models']) {
    if (!Array.isArray(catalog[collection])) errors.push(`catalog.${collection} must be an array`)
  }
  if (errors.some((error) => error.includes('must be an array'))) return errors

  uniqueIds(catalog.providers, 'providers', errors)
  uniqueIds(catalog.benchmarks, 'benchmarks', errors)
  uniqueIds(catalog.models, 'models', errors)

  const providerIds = new Set()
  for (const [index, provider] of catalog.providers.entries()) {
    const at = `providers[${index}]`
    validId(provider.id, `${at}.id`, errors)
    requiredString(provider.name, `${at}.name`, errors)
    if (!isUrl(provider.websiteUrl)) errors.push(`${at}.websiteUrl must be an http(s) URL`)
    if (typeof provider.accent !== 'string' || !/^#[0-9a-f]{6}$/i.test(provider.accent)) {
      errors.push(`${at}.accent must be a six-digit hex color`)
    }
    providerIds.add(provider.id)
  }

  const benchmarkById = new Map()
  for (const [index, benchmark] of catalog.benchmarks.entries()) {
    const at = `benchmarks[${index}]`
    validId(benchmark.id, `${at}.id`, errors)
    requiredString(benchmark.name, `${at}.name`, errors)
    requiredString(benchmark.shortName, `${at}.shortName`, errors)
    requiredString(benchmark.description, `${at}.description`, errors)
    requiredString(benchmark.metricLabel, `${at}.metricLabel`, errors)
    requiredString(benchmark.version, `${at}.version`, errors)
    if (!CATEGORIES.has(benchmark.category)) errors.push(`${at}.category is not supported`)
    if (!UNITS.has(benchmark.unit)) errors.push(`${at}.unit is not supported`)
    if (!DIRECTIONS.has(benchmark.direction)) errors.push(`${at}.direction is not supported`)
    if (!isUrl(benchmark.sourceUrl)) errors.push(`${at}.sourceUrl must be an http(s) URL`)
    if (benchmark.scale !== undefined) {
      if (!Number.isFinite(benchmark.scale?.min) || !Number.isFinite(benchmark.scale?.max) || benchmark.scale.min >= benchmark.scale.max) {
        errors.push(`${at}.scale must contain numeric min < max`)
      }
    }
    benchmarkById.set(benchmark.id, benchmark)
  }

  if (catalog.benchmarks.length < 15) errors.push('catalog must register at least 15 benchmarks')
  for (const required of ['automationbench', 'deepswe', 'agents-last-exam']) {
    if (!benchmarkById.has(required)) errors.push(`required benchmark "${required}" is missing`)
  }

  for (const [index, model] of catalog.models.entries()) {
    const at = `models[${index}]`
    validId(model.id, `${at}.id`, errors)
    requiredString(model.name, `${at}.name`, errors)
    requiredString(model.providerId, `${at}.providerId`, errors)
    if (!providerIds.has(model.providerId)) errors.push(`${at}.providerId references unknown provider "${model.providerId}"`)
    if (!['closed', 'open-weights'].includes(model.access)) errors.push(`${at}.access must be closed or open-weights`)
    if (!['verified', 'provisional'].includes(model.status)) errors.push(`${at}.status must be verified or provisional`)
    validDate(model.reviewedAt, `${at}.reviewedAt`, errors)
    validDate(model.releasedAt, `${at}.releasedAt`, errors, true)

    for (const field of ['inputPrice', 'outputPrice']) {
      if (model[field] !== undefined && (!Number.isFinite(model[field]) || model[field] < 0)) {
        errors.push(`${at}.${field} must be a non-negative number when provided`)
      }
    }
    if (model.contextWindow !== undefined && (!Number.isInteger(model.contextWindow) || model.contextWindow <= 0)) {
      errors.push(`${at}.contextWindow must be a positive integer when provided`)
    }
    if (!Array.isArray(model.sourceUrls) || model.sourceUrls.length === 0) {
      errors.push(`${at}.sourceUrls must contain at least one URL`)
    } else {
      model.sourceUrls.forEach((url, sourceIndex) => {
        if (!isUrl(url)) errors.push(`${at}.sourceUrls[${sourceIndex}] must be an http(s) URL`)
      })
    }
    if (!Array.isArray(model.results)) {
      errors.push(`${at}.results must be an array`)
      continue
    }

    const resultKeys = new Set()
    for (const [resultIndex, result] of model.results.entries()) {
      const resultAt = `${at}.results[${resultIndex}]`
      requiredString(result.benchmarkId, `${resultAt}.benchmarkId`, errors)
      const benchmark = benchmarkById.get(result.benchmarkId)
      if (!benchmark) errors.push(`${resultAt}.benchmarkId references unknown benchmark "${result.benchmarkId}"`)
      if (!Number.isFinite(result.score)) errors.push(`${resultAt}.score must be a finite number`)
      if (benchmark?.scale && Number.isFinite(result.score) && (result.score < benchmark.scale.min || result.score > benchmark.scale.max)) {
        errors.push(`${resultAt}.score must be between ${benchmark.scale.min} and ${benchmark.scale.max}`)
      }
      if (!isUrl(result.sourceUrl)) errors.push(`${resultAt}.sourceUrl must be an http(s) URL`)
      validDate(result.reviewedAt, `${resultAt}.reviewedAt`, errors)
      requiredString(result.benchmarkVersion, `${resultAt}.benchmarkVersion`, errors)
      const key = `${result.benchmarkId}|${result.benchmarkVersion}|${result.modelVariant ?? ''}`
      if (resultKeys.has(key)) errors.push(`${at} has duplicate result "${key}"`)
      resultKeys.add(key)
    }
  }

  return errors
}

export function readInputFile(argv) {
  const flagIndex = argv.indexOf('--file')
  const file = flagIndex >= 0 ? argv[flagIndex + 1] : argv[2]
  if (!file) throw new Error('Missing input. Usage: --file path/to/record.json')
  return loadJson(path.resolve(process.cwd(), file))
}
