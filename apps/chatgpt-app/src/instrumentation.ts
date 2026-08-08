import * as Sentry from "@sentry/node"
import { scrubSentryEvent } from "./lib/sentry-privacy.js"

const dsn = process.env.SENTRY_CHATGPT_DSN?.trim()

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT,
  release: process.env.SENTRY_RELEASE,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    stackFrameVariables: false,
    frameContextLines: 0,
  },
  enableLogs: false,
  maxBreadcrumbs: 0,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: (event) => scrubSentryEvent(event),
})

export { Sentry }
