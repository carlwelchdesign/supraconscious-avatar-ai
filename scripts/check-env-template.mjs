import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

const rootDir = process.cwd()
const envExamplePath = path.join(rootDir, ".env.example")
const scanRoots = ["apps", "packages", "scripts"]
const sourceExtensions = new Set([".js", ".mjs", ".ts", ".tsx"])
const ignoredVariables = new Set(["NODE_ENV", "PORT"])

function walk(dir) {
  const entries = readdirSync(dir)
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === "dist") continue
      files.push(...walk(fullPath))
      continue
    }

    if (stats.isFile() && sourceExtensions.has(path.extname(entry))) {
      files.push(fullPath)
    }
  }

  return files
}

function readEnvExampleKeys() {
  const contents = readFileSync(envExamplePath, "utf8")
  const keys = new Set()

  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/)
    if (match) keys.add(match[1])
  }

  return keys
}

function findUsedEnvKeys() {
  const directPatterns = [
    /process\.env\.([A-Z0-9_]+)/g,
    /process\.env\[['"]([A-Z0-9_]+)['"]\]/g,
  ]
  const used = new Map()

  for (const scanRoot of scanRoots) {
    const rootPath = path.join(rootDir, scanRoot)
    const files = walk(rootPath)

    for (const file of files) {
      const contents = readFileSync(file, "utf8")
      const relativePath = path.relative(rootDir, file)

      for (const pattern of directPatterns) {
        for (const match of contents.matchAll(pattern)) {
          const key = match[1]
          if (ignoredVariables.has(key)) continue
          if (!used.has(key)) used.set(key, new Set())
          used.get(key).add(relativePath)
        }
      }
    }
  }

  return used
}

const envExampleKeys = readEnvExampleKeys()
const usedEnvKeys = findUsedEnvKeys()
const missing = [...usedEnvKeys.keys()].filter((key) => !envExampleKeys.has(key)).sort()

if (missing.length > 0) {
  console.error(".env.example is missing variables used by the codebase:")
  for (const key of missing) {
    console.error(`- ${key}: ${[...usedEnvKeys.get(key)].sort().join(", ")}`)
  }
  process.exit(1)
}

console.log(`.env.example covers ${usedEnvKeys.size} direct runtime environment variables.`)
