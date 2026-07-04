import { runFounderCalibrationReport } from "../src/founder-calibration-report.js"

const report = await runFounderCalibrationReport()
console.log(JSON.stringify(report, null, 2))
