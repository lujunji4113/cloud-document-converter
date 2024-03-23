import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const resolveRelativePath = relativePath =>
  fileURLToPath(new URL(`../${relativePath}`, import.meta.url))

const readJson = relativePath => {
  try {
    const filePath = resolveRelativePath(relativePath)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const json = JSON.parse(fileContent)
    return json
  } catch (error) {
    return null
  }
}

const main = () => {
  let manifestJson = readJson('dist/manifest.json')
  const packageJson = readJson('package.json')
  if (!manifestJson || !packageJson) return

  manifestJson.version = packageJson.version

  fs.writeFileSync(
    resolveRelativePath('dist/manifest.json'),
    JSON.stringify(manifestJson),
  )

  console.log(`Extension version: ${manifestJson.version}`)
}

main()
