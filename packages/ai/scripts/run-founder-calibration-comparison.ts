import { runFounderCalibrationComparison } from "../src/founder-calibration-comparison.js"

const report = await runFounderCalibrationComparison()
console.log(JSON.stringify(report, null, 2))
