import { catalogPath, loadJson, validateCatalog } from './catalog-utils.mjs'

const catalog = loadJson(catalogPath)
const errors = validateCatalog(catalog)

if (errors.length) {
  console.error(`Catalog validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:`)
  for (const error of errors) console.error(`  • ${error}`)
  process.exit(1)
}

const resultCount = catalog.models.reduce((sum, model) => sum + model.results.length, 0)
console.log(`Catalog valid — ${catalog.models.length} models, ${catalog.providers.length} providers, ${catalog.benchmarks.length} benchmarks, ${resultCount} results.`)
