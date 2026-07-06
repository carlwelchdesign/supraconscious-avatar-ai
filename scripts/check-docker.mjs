import { spawn } from "node:child_process"

const timeoutMs = Number.parseInt(process.env.DOCKER_PREFLIGHT_TIMEOUT_MS ?? "8000", 10)

const child = spawn("docker", ["info"], {
  stdio: ["ignore", "ignore", "pipe"],
})

let stderr = ""
let settled = false

const timeout = setTimeout(() => {
  if (settled) return
  settled = true
  child.kill("SIGTERM")
  console.error(`Docker is not responding after ${timeoutMs}ms.`)
  console.error("Open Docker Desktop or restart the Docker daemon, then rerun the Docker command.")
  process.exit(1)
}, timeoutMs)

child.stderr.on("data", (chunk) => {
  stderr += chunk.toString()
})

child.on("error", (error) => {
  if (settled) return
  settled = true
  clearTimeout(timeout)
  if (error.code === "ENOENT") {
    console.error("Docker is not installed or is not available on PATH.")
  } else {
    console.error(`Docker preflight failed: ${error.message}`)
  }
  process.exit(1)
})

child.on("exit", (code) => {
  if (settled) return
  settled = true
  clearTimeout(timeout)
  if (code === 0) process.exit(0)

  const detail = stderr.trim()
  console.error("Docker is not ready.")
  if (detail) console.error(detail)
  console.error("Open Docker Desktop or restart the Docker daemon, then rerun the Docker command.")
  process.exit(code ?? 1)
})
