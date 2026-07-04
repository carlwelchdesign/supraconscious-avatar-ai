import { runFounderCalibrationSetupReport } from "../src/founder-calibration-setup-report.js"

const report = await runFounderCalibrationSetupReport()

if (report.readiness.ready) {
  console.log("Founder calibration launch is ready.")
  process.exit(0)
}

console.log("Founder calibration launch is not ready.")
for (const blocker of report.blockers) {
  console.log(`- ${blocker}`)
}

process.exitCode = 1
