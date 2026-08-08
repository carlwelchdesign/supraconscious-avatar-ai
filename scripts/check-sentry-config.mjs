import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8")

const privacyFiles = [
  "apps/web/src/lib/sentry-privacy.ts",
  "apps/admin/src/lib/sentry-privacy.ts",
  "apps/chatgpt-app/src/instrumentation.ts",
]

for (const file of privacyFiles) {
  const source = read(file)
  assert.match(source, /userInfo:\s*false/, `${file} must disable inferred user information`)
  assert.match(source, /cookies:\s*false/, `${file} must disable cookies`)
  assert.match(source, /httpBodies:\s*\[\]/, `${file} must disable HTTP bodies`)
  assert.match(source, /urlQueryParams:\s*false/, `${file} must disable query parameters`)
  assert.match(source, /inputs:\s*false/, `${file} must disable generative AI inputs`)
  assert.match(source, /outputs:\s*false/, `${file} must disable generative AI outputs`)
  assert.match(source, /stackFrameVariables:\s*false/, `${file} must disable local-variable capture`)
  assert.match(source, /tracesSampleRate:\s*0/, `${file} must keep tracing off by default`)
  assert.match(source, /enableLogs:\s*false/, `${file} must keep logs off`)
}

for (const file of [
  "apps/web/src/lib/sentry-privacy.ts",
  "apps/admin/src/lib/sentry-privacy.ts",
  "apps/chatgpt-app/src/lib/sentry-privacy.ts",
]) {
  const source = read(file)
  assert.match(source, /exception\.value = "Application error"/, `${file} must redact exception messages`)
  assert.match(source, /event\.message = undefined/, `${file} must remove standalone event messages`)
  assert.match(source, /event\.contexts = undefined/, `${file} must remove manually attached contexts`)
}

const mobile = read("apps/mobile/lib/main.dart")
for (const pattern of [
  /dsn\.trim\(\)\.isEmpty/,
  /sendDefaultPii = false/,
  /tracesSampleRate = 0/,
  /enableAutoPerformanceTracing = false/,
  /enableUserInteractionTracing = false/,
  /attachScreenshot = false/,
  /attachViewHierarchy = false/,
  /\.request = null/,
  /exception\.value = 'Application error'/,
  /event\.message = null/,
]) {
  assert.match(mobile, pattern, `mobile Sentry configuration is missing ${pattern}`)
}

for (const app of ["web", "admin"]) {
  assert.match(read(`apps/${app}/src/instrumentation.ts`), /captureRequestError/)
  assert.match(read(`apps/${app}/src/instrumentation-client.ts`), /enabled:\s*Boolean\(dsn\)/)
  assert.match(read(`apps/${app}/src/app/global-error.tsx`), /captureException\(error\)/)
  assert.match(read(`apps/${app}/next.config.ts`), /telemetry:\s*false/)
}

assert.match(read("apps/chatgpt-app/src/server.ts"), /Sentry\.setupExpressErrorHandler\(app\)/)
assert.match(read("apps/chatgpt-app/src/instrumentation.ts"), /enabled:\s*Boolean\(dsn\)/)

const trackedSentryFiles = [
  ...privacyFiles,
  "apps/web/sentry.server.config.ts",
  "apps/web/sentry.edge.config.ts",
  "apps/web/src/instrumentation-client.ts",
  "apps/admin/sentry.server.config.ts",
  "apps/admin/sentry.edge.config.ts",
  "apps/admin/src/instrumentation-client.ts",
  "apps/chatgpt-app/src/instrumentation.ts",
  "apps/mobile/lib/main.dart",
]

for (const file of trackedSentryFiles) {
  assert.doesNotMatch(read(file), /https:\/\/[^\s"']+@[^\s"']*sentry/i, `${file} contains a hard-coded Sentry DSN`)
}

const envTemplate = read(".env.example")
for (const key of [
  "SENTRY_WEB_DSN",
  "NEXT_PUBLIC_SENTRY_WEB_DSN",
  "SENTRY_ADMIN_DSN",
  "NEXT_PUBLIC_SENTRY_ADMIN_DSN",
  "SENTRY_CHATGPT_DSN",
  "SENTRY_MOBILE_DSN",
  "SENTRY_ENVIRONMENT",
  "SENTRY_RELEASE",
  "SENTRY_ORG",
  "SENTRY_WEB_PROJECT",
  "SENTRY_ADMIN_PROJECT",
  "SENTRY_AUTH_TOKEN",
]) {
  assert.match(envTemplate, new RegExp(`^${key}=`, "m"), `.env.example is missing ${key}`)
}

console.log("Sentry configuration is optional, privacy-minimized, and covered across all runtime apps.")
