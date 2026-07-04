import { buildFounderCalibrationLaunchPacket, runFounderCalibrationHandoffReport } from "../src/founder-calibration-setup-report.js"

const webAppBaseUrl = readArg("--web-url") ?? process.env.FOUNDER_HANDOFF_WEB_URL ?? "http://localhost:3000"
const adminAppBaseUrl = readArg("--admin-url") ?? process.env.FOUNDER_HANDOFF_ADMIN_URL ?? "http://localhost:3001"
const report = await runFounderCalibrationHandoffReport({ webAppBaseUrl, adminAppBaseUrl })

console.log(buildFounderCalibrationLaunchPacket(report, { webAppBaseUrl, adminAppBaseUrl }))

function readArg(name: string) {
  const index = process.argv.indexOf(name)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  return value && !value.startsWith("--") ? value : undefined
}
