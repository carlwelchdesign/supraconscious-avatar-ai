import { importSourceCorpus } from "../src/source-import-runner.js"

const sourceRoot = process.argv[2] ?? "sources"

const result = await importSourceCorpus(sourceRoot)
console.log(JSON.stringify(result, null, 2))
