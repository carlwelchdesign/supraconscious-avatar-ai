type SmokeCase = {
  name: string
  url: string
  expectedStatus: number | number[]
  expectedRedirectPath?: string
  expectedBodyIncludes?: string[]
}

type SmokeResult = {
  name: string
  url: string
  passed: boolean
  status: number | null
  redirectLocation: string | null
  error?: string
}

const webAppBaseUrl = normalizeBaseUrl(readArg("--web-url") ?? process.env.FOUNDER_HANDOFF_WEB_URL ?? "http://localhost:3000")
const adminAppBaseUrl = normalizeBaseUrl(readArg("--admin-url") ?? process.env.FOUNDER_HANDOFF_ADMIN_URL ?? "http://localhost:3001")
const passes = Number(readArg("--passes") ?? "1")
const timeoutMs = Number(readArg("--timeout-ms") ?? "5000")
const smokeEmail = "founder-smoke@example.com"

const cases: SmokeCase[] = [
  {
    name: "web login",
    url: `${webAppBaseUrl}/login`,
    expectedStatus: 200,
  },
  {
    name: "web founder login handoff preserves email and onboarding next step",
    url: `${webAppBaseUrl}/login?email=${encodeURIComponent(smokeEmail)}&next=${encodeURIComponent("/onboarding")}`,
    expectedStatus: 200,
    expectedBodyIncludes: [`value="${smokeEmail}"`, `name="next"`, `value="/onboarding"`],
  },
  {
    name: "web register",
    url: `${webAppBaseUrl}/register`,
    expectedStatus: 200,
  },
  {
    name: "web founder register handoff preserves email and onboarding next step",
    url: `${webAppBaseUrl}/register?email=${encodeURIComponent(smokeEmail)}&next=${encodeURIComponent("/onboarding")}`,
    expectedStatus: 200,
    expectedBodyIncludes: [`value="${smokeEmail}"`, `name="next"`, `value="/onboarding"`],
  },
  {
    name: "web onboarding protects anonymous users",
    url: `${webAppBaseUrl}/onboarding`,
    expectedStatus: [302, 303, 307, 308],
    expectedRedirectPath: "/login",
  },
  {
    name: "web journal protects anonymous users",
    url: `${webAppBaseUrl}/journal`,
    expectedStatus: [302, 303, 307, 308],
    expectedRedirectPath: "/login",
  },
  {
    name: "admin login",
    url: `${adminAppBaseUrl}/login`,
    expectedStatus: 200,
  },
  {
    name: "admin founder setup protects anonymous users",
    url: `${adminAppBaseUrl}/calibration/setup`,
    expectedStatus: [302, 303, 307, 308],
    expectedRedirectPath: "/login",
  },
  {
    name: "admin founder live review protects anonymous users",
    url: `${adminAppBaseUrl}/calibration/live`,
    expectedStatus: [302, 303, 307, 308],
    expectedRedirectPath: "/login",
  },
]

const safePasses = Number.isFinite(passes) && passes > 0 ? Math.floor(passes) : 1
const results: Array<{ pass: number; cases: SmokeResult[] }> = []

for (let pass = 1; pass <= safePasses; pass += 1) {
  results.push({
    pass,
    cases: await Promise.all(cases.map((testCase) => runSmokeCase(testCase, timeoutMs))),
  })
}

const failed = results.flatMap((passResult) => passResult.cases.filter((result) => !result.passed))
const report = {
  passed: failed.length === 0,
  checkedAt: new Date().toISOString(),
  webAppBaseUrl,
  adminAppBaseUrl,
  passes: safePasses,
  failedCount: failed.length,
  results,
}

console.log(JSON.stringify(report, null, 2))
if (!report.passed) process.exitCode = 1

async function runSmokeCase(testCase: SmokeCase, timeout: number): Promise<SmokeResult> {
  try {
    const response = await fetch(testCase.url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(Number.isFinite(timeout) && timeout > 0 ? timeout : 5000),
    })
    const redirectLocation = response.headers.get("location")
    const passedStatus = toStatusList(testCase.expectedStatus).includes(response.status)
    const passedRedirect = testCase.expectedRedirectPath
      ? redirectLocationMatches(redirectLocation, testCase.expectedRedirectPath)
      : true
    const body = testCase.expectedBodyIncludes ? await response.text() : ""
    const passedBody = testCase.expectedBodyIncludes
      ? testCase.expectedBodyIncludes.every((expected) => body.includes(expected))
      : true

    return {
      name: testCase.name,
      url: testCase.url,
      passed: passedStatus && passedRedirect && passedBody,
      status: response.status,
      redirectLocation,
      error: passedBody ? undefined : "Response body did not include expected founder handoff form values.",
    }
  } catch (error) {
    return {
      name: testCase.name,
      url: testCase.url,
      passed: false,
      status: null,
      redirectLocation: null,
      error: error instanceof Error ? error.message : "Unknown smoke check error",
    }
  }
}

function redirectLocationMatches(location: string | null, expectedPath: string) {
  if (!location) return false
  try {
    return new URL(location).pathname === expectedPath
  } catch {
    return location.startsWith(expectedPath)
  }
}

function toStatusList(status: number | number[]) {
  return Array.isArray(status) ? status : [status]
}

function readArg(name: string) {
  const index = process.argv.indexOf(name)
  const value = index >= 0 ? process.argv[index + 1] : undefined
  return value && !value.startsWith("--") ? value : undefined
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "")
}
