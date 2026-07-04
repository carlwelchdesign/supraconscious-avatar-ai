import { runPilotLearningReport } from "../src/pilot-learning-report.js"

const report = await runPilotLearningReport()
console.log(JSON.stringify(report, null, 2))

if (report.blockers.length > 0) {
  process.exitCode = 1
}
