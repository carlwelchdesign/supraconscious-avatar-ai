import { runFounderCalibrationSetupReport } from "../src/founder-calibration-setup-report.js"

const report = await runFounderCalibrationSetupReport()
console.log(JSON.stringify(report, null, 2))
