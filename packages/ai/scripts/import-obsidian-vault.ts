import { existsSync } from "node:fs"
import { importObsidianVault } from "../src/obsidian-vault-importer.js"

const vaultRoot = process.argv[2] ?? process.env.OBSIDIAN_VAULT_PATH

if (!vaultRoot) {
  console.error("Missing Obsidian vault path. Pass a path argument or set OBSIDIAN_VAULT_PATH.")
  process.exit(1)
}

if (!existsSync(vaultRoot)) {
  console.error(`Obsidian vault path does not exist: ${vaultRoot}`)
  process.exit(1)
}

const result = await importObsidianVault(vaultRoot)
console.log(JSON.stringify(result, null, 2))
