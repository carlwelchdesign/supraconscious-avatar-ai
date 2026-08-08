import assert from "node:assert/strict"
import test from "node:test"
import { SENTRY_PRIVACY_OPTIONS, scrubSentryEvent } from "../src/lib/sentry-privacy"

test("admin Sentry defaults and event scrubbing exclude private data", () => {
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.userInfo, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.cookies, false)
  assert.deepEqual(SENTRY_PRIVACY_OPTIONS.dataCollection.httpBodies, [])
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.urlQueryParams, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.genAI.inputs, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.genAI.outputs, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.tracesSampleRate, 0)
  assert.equal(SENTRY_PRIVACY_OPTIONS.enableLogs, false)

  const event = {
    user: { email: "private@example.com" },
    message: "private journal text",
    contexts: { private: { reflection: "private journal text" } },
    exception: { values: [{ type: "Error", value: "private journal text", stacktrace: { frames: [] } }] },
    extra: { reflection: "private journal text" },
    breadcrumbs: [{ message: "private journal text" }],
    request: {
      method: "GET",
      url: "https://admin.example.com/users?email=private@example.com",
      headers: { cookie: "secret" },
    },
  }

  const scrubbed = scrubSentryEvent(event)
  assert.equal(scrubbed.user, undefined)
  assert.equal(scrubbed.extra, undefined)
  assert.equal(scrubbed.breadcrumbs, undefined)
  assert.equal(scrubbed.message, undefined)
  assert.equal(scrubbed.contexts, undefined)
  assert.equal(scrubbed.exception.values[0]?.value, "Application error")
  assert.deepEqual(scrubbed.request, {
    method: "GET",
    url: "https://admin.example.com/users",
  })
})
