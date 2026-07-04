import { runFounderCalibrationFixtures } from "../src/founder-calibration-fixtures.js"

const report = runFounderCalibrationFixtures()
console.log(JSON.stringify(report, null, 2))

if (!report.passed) {
  process.exitCode = 1
}
