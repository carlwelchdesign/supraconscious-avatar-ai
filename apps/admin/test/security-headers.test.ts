import assert from "node:assert/strict"
import test from "node:test"
import nextConfig from "../next.config"

test("admin app applies baseline browser security headers", async () => {
  const headersFn = nextConfig.headers
  if (typeof headersFn !== "function") {
    throw new Error("Expected admin Next config to define headers().")
  }

  const rules = await headersFn()
  const headers = Object.fromEntries(rules[0]?.headers.map((header) => [header.key, header.value]) ?? [])

  assert.equal(rules[0]?.source, "/:path*")
  assert.equal(headers["X-Content-Type-Options"], "nosniff")
  assert.equal(headers["X-Frame-Options"], "DENY")
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin")
  assert.equal(headers["Permissions-Policy"], "camera=(), geolocation=(), payment=()")
})
