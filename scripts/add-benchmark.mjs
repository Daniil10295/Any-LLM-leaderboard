import { catalogPath, loadJson, readInputFile, validateCatalog, writeCatalog } from './catalog-utils.mjs'

try {
  const benchmark = readInputFile(process.argv)
  const catalog = loadJson(catalogPath)
  if (catalog.benchmarks.some((item) => item.id === benchmark.id)) {
    throw new Error(`Benchmark id "${benchmark.id}" already exists`)
  }
  catalog.benchmarks.push(benchmark)
  catalog.benchmarks.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  catalog.updatedAt = new Date().toISOString().slice(0, 10)
  const errors = validateCatalog(catalog)
  if (errors.length) throw new Error(`Catalog would be invalid:\n  • ${errors.join('\n  • ')}`)
  writeCatalog(catalog)
  console.log(`Added ${benchmark.name} (${benchmark.id}). Run npm run build to verify the site.`)
} catch (error) {
  console.error(`Could not add benchmark: ${error.message}`)
  process.exit(1)
}
