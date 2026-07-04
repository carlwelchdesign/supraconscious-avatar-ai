import { runPilotExpansionReadiness } from "../src/pilot-expansion-readiness.js"

const report = await runPilotExpansionReadiness()
console.log(JSON.stringify(report, null, 2))

if (process.env.PILOT_EXPANSION_STRICT === "true" && !report.passed) {
  process.exitCode = 1
}
