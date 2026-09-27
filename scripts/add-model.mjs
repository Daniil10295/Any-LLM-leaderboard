import { catalogPath, loadJson, readInputFile, validateCatalog, writeCatalog } from './catalog-utils.mjs'

try {
  const model = readInputFile(process.argv)
  const catalog = loadJson(catalogPath)
  if (catalog.models.some((item) => item.id === model.id)) {
    throw new Error(`Model id "${model.id}" already exists`)
  }
  catalog.models.push(model)
  catalog.models.sort((a, b) => a.providerId.localeCompare(b.providerId) || a.name.localeCompare(b.name))
  catalog.updatedAt = new Date().toISOString().slice(0, 10)
  const errors = validateCatalog(catalog)
  if (errors.length) throw new Error(`Catalog would be invalid:\n  • ${errors.join('\n  • ')}`)
  writeCatalog(catalog)
  console.log(`Added ${model.name} (${model.id}). Run npm run build to verify the site.`)
} catch (error) {
  console.error(`Could not add model: ${error.message}`)
  process.exit(1)
}
