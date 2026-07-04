import { runFounderCalibrationRegression } from "../src/founder-calibration-regression.js"

const report = await runFounderCalibrationRegression()
console.log(JSON.stringify(report, null, 2))

if (!report.passed) {
  process.exitCode = 1
}
