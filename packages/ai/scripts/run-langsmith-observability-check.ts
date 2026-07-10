import { runLangSmithObservabilityCheck } from "../src/langsmith-observability.js"

const report = await runLangSmithObservabilityCheck()
console.log(JSON.stringify(report, null, 2))

if (!report.passed) {
  process.exitCode = 1
}
