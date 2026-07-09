import { spawn } from "node:child_process"

const timeoutMs = Number.parseInt(process.env.FLUTTER_PREFLIGHT_TIMEOUT_MS ?? "15000", 10)

const child = spawn("flutter", ["--version"], {
  stdio: ["ignore", "pipe", "pipe"],
})

let stdout = ""
let stderr = ""
let settled = false

const timeout = setTimeout(() => {
  if (settled) return
  settled = true
  child.kill("SIGTERM")
  console.error(`Flutter is not responding after ${timeoutMs}ms.`)
  console.error("Install or repair Flutter, then rerun the mobile command.")
  process.exit(1)
}, timeoutMs)

child.stdout.on("data", (chunk) => {
  stdout += chunk.toString()
})

child.stderr.on("data", (chunk) => {
  stderr += chunk.toString()
})

child.on("error", (error) => {
  if (settled) return
  settled = true
  clearTimeout(timeout)
  if (error.code === "ENOENT") {
    console.error("Flutter is not installed or is not available on PATH.")
    console.error("Install Flutter before scaffolding or running apps/mobile.")
    console.error("Setup notes: docs/mobile-flutter.md")
  } else {
    console.error(`Flutter preflight failed: ${error.message}`)
  }
  process.exit(1)
})

child.on("exit", (code) => {
  if (settled) return
  settled = true
  clearTimeout(timeout)
  if (code === 0) {
    const versionLine = stdout.split(/\r?\n/).find((line) => line.trim().length > 0)
    console.log(versionLine ?? "Flutter is available.")
    process.exit(0)
  }

  const detail = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n")
  console.error("Flutter is not ready.")
  if (detail) console.error(detail)
  console.error("Install or repair Flutter, then rerun the mobile command.")
  process.exit(code ?? 1)
})
