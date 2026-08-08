import * as Sentry from "@sentry/nextjs"
import { SENTRY_PRIVACY_OPTIONS, scrubSentryEvent } from "./lib/sentry-privacy"

const dsn = process.env.NEXT_PUBLIC_SENTRY_ADMIN_DSN?.trim()

Sentry.init({
  ...SENTRY_PRIVACY_OPTIONS,
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  beforeSend: (event) => scrubSentryEvent(event),
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
