import { runKeywordRagEvals } from "../src/rag-eval.js"

const report = runKeywordRagEvals()
console.log(JSON.stringify(report, null, 2))

if (!report.passed) {
  process.exitCode = 1
}
