import {
  buildFounderCalibrationHandoffReport,
  runFounderCalibrationSetupReport,
} from "../src/founder-calibration-setup-report.js"

const report = await runFounderCalibrationSetupReport()
const webAppBaseUrl = readArg("--web-url") ?? process.env.FOUNDER_HANDOFF_WEB_URL ?? "http://localhost:3000"
const adminAppBaseUrl = readArg("--admin-url") ?? process.env.FOUNDER_HANDOFF_ADMIN_URL ?? "http://localhost:3001"
const handoff = buildFounderCalibrationHandoffReport(report, {
  webAppBaseUrl,
  adminAppBaseUrl,
})

if (report.readiness.ready) {
  console.log("Founder calibration live actions are complete.")
  printHandoff()
  process.exit(0)
}

console.log("Founder calibration has remaining live founder actions.")
for (const blocker of report.blockers) {
  console.log(`- ${blocker}`)
}
console.log("")
printHandoff()

process.exitCode = 1

function printHandoff() {
  console.log("Before sending links, verify local routes:")
  console.log(`  node .yarn/releases/yarn-4.cjs smoke:founder-local --web-url ${webAppBaseUrl} --admin-url ${adminAppBaseUrl} --passes 3`)
  console.log("")
  console.log("Next founder actions:")
  for (const item of handoff.items) {
    console.log(`- ${item.role}: ${item.nextAction}`)
    if (item.primaryHref) console.log(`  Link: ${item.primaryHref}`)
    console.log(`  Handoff: ${item.handoffText}`)
  }
}

function readArg(name: string) {
  const index = process.argv.indexOf(name)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  return value && !value.startsWith("--") ? value : undefined
}
