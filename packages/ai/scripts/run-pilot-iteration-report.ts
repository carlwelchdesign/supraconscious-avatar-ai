import { runPilotIterationReport } from "../src/pilot-iteration-report.js"

const report = await runPilotIterationReport()
console.log(JSON.stringify(report, null, 2))
