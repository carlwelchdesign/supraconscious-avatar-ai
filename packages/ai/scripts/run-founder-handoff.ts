import { runFounderCalibrationHandoffReport } from "../src/founder-calibration-setup-report.js"

const report = await runFounderCalibrationHandoffReport({
  webAppBaseUrl: readArg("--web-url") ?? process.env.FOUNDER_HANDOFF_WEB_URL ?? "http://localhost:3000",
  adminAppBaseUrl: readArg("--admin-url") ?? process.env.FOUNDER_HANDOFF_ADMIN_URL ?? "http://localhost:3001",
})

for (const item of report.items) {
  console.log(`## ${item.role.toUpperCase()}`)
  console.log(`Email: ${item.email ?? "not configured"}`)
  console.log(`Next action: ${item.nextAction}`)
  if (item.primaryHref) console.log(`Primary link: ${item.primaryHref}`)
  console.log("")
  console.log(item.handoffText)
  console.log("")
}

if (report.blockers.length > 0) {
  console.log("## Blockers")
  for (const blocker of report.blockers) console.log(`- ${blocker}`)
}

if (report.warnings.length > 0) {
  console.log("")
  console.log("## Warnings")
  for (const warning of report.warnings) console.log(`- ${warning}`)
}

function readArg(name: string) {
  const index = process.argv.indexOf(name)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  return value && !value.startsWith("--") ? value : undefined
}
