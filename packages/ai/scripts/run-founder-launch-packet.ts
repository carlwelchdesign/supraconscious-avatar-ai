import { runFounderCalibrationHandoffReport } from "../src/founder-calibration-setup-report.js"

const webAppBaseUrl = readArg("--web-url") ?? process.env.FOUNDER_HANDOFF_WEB_URL ?? "http://localhost:3000"
const adminAppBaseUrl = readArg("--admin-url") ?? process.env.FOUNDER_HANDOFF_ADMIN_URL ?? "http://localhost:3001"
const report = await runFounderCalibrationHandoffReport({ webAppBaseUrl, adminAppBaseUrl })

console.log("# Founder Calibration Launch Packet")
console.log("")
console.log(`Checked at: ${report.checkedAt}`)
console.log("")
console.log("## Start Local Apps")
console.log("Run: yarn dev:founder-calibration")
console.log(`Admin setup: ${normalizeBaseUrl(adminAppBaseUrl)}/calibration/setup`)
console.log(`Admin live review: ${normalizeBaseUrl(adminAppBaseUrl)}/calibration/live`)
console.log("")
console.log("## Founder Handoff")
for (const item of report.items) {
  console.log(`### ${item.role.toUpperCase()}`)
  console.log(`Email: ${item.email ?? "not configured"}`)
  console.log(`Next action: ${item.nextAction}`)
  if (item.primaryHref) console.log(`Primary link: ${item.primaryHref}`)
  console.log("")
  console.log(item.handoffText)
  console.log("")
}

if (report.blockers.length > 0) {
  console.log("## Current Blockers")
  for (const blocker of report.blockers) console.log(`- ${blocker}`)
  console.log("")
}

if (report.warnings.length > 0) {
  console.log("## Warnings")
  for (const warning of report.warnings) console.log(`- ${warning}`)
  console.log("")
}

console.log("## After First Sessions")
console.log("- Review sessions in admin live review.")
console.log("- Mark strong sessions ready/golden or assign a voice, source, prompt, intensity, or embodiment issue.")
console.log("- Run: yarn report:founder-calibration")
console.log("- Run: yarn report:founder-calibration-comparison")
console.log("- Run: yarn check:founder-calibration-launch")

function readArg(name: string) {
  const index = process.argv.indexOf(name)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  return value && !value.startsWith("--") ? value : undefined
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "")
}
