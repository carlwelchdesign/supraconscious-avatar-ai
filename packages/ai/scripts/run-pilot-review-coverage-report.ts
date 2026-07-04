import { runPilotReviewCoverageReport } from "../src/pilot-review-coverage-report.js"

const report = await runPilotReviewCoverageReport()
console.log(JSON.stringify(report, null, 2))
