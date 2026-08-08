import * as Sentry from "@sentry/nextjs"
import { SENTRY_PRIVACY_OPTIONS, scrubSentryEvent } from "./src/lib/sentry-privacy"

const dsn = process.env.SENTRY_ADMIN_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_ADMIN_DSN?.trim()

Sentry.init({
  ...SENTRY_PRIVACY_OPTIONS,
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT,
  release: process.env.SENTRY_RELEASE,
  beforeSend: (event) => scrubSentryEvent(event),
})
