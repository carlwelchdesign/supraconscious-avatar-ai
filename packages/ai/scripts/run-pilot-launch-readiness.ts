import { runPilotLaunchReadiness } from "../src/pilot-launch-readiness.js"

const report = await runPilotLaunchReadiness()
console.log(JSON.stringify(report, null, 2))

if (!report.passed) {
  process.exitCode = 1
}
