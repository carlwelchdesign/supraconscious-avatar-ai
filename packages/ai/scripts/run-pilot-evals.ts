import { runPilotCouncilEvals } from "../src/pilot-council-eval.js"

const report = runPilotCouncilEvals()
console.log(JSON.stringify(report, null, 2))

if (!report.passed) {
  process.exitCode = 1
}
