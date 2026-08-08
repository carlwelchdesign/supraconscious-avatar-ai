import assert from "node:assert/strict"
import test from "node:test"
import { SENTRY_PRIVACY_OPTIONS, scrubSentryEvent } from "../src/lib/sentry-privacy"

test("Sentry privacy defaults disable sensitive collection", () => {
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.userInfo, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.cookies, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.httpHeaders.request, false)
  assert.deepEqual(SENTRY_PRIVACY_OPTIONS.dataCollection.httpBodies, [])
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.urlQueryParams, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.genAI.inputs, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.genAI.outputs, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.databaseQueryData, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.dataCollection.stackFrameVariables, false)
  assert.equal(SENTRY_PRIVACY_OPTIONS.tracesSampleRate, 0)
  assert.equal(SENTRY_PRIVACY_OPTIONS.replaysSessionSampleRate, 0)
  assert.equal(SENTRY_PRIVACY_OPTIONS.enableLogs, false)
})

test("Sentry event scrubbing removes private payloads and URL parameters", () => {
  const event = {
    user: { email: "private@example.com" },
    message: "private journal text",
    contexts: { private: { reflection: "private journal text" } },
    exception: { values: [{ type: "Error", value: "private journal text", stacktrace: { frames: [] } }] },
    extra: { reflection: "private journal text" },
    breadcrumbs: [{ message: "private journal text" }],
    request: {
      method: "POST",
      url: "https://example.com/journal?entry=private#response",
      data: { text: "private journal text" },
      headers: { authorization: "Bearer secret" },
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
    method: "POST",
    url: "https://example.com/journal",
  })
})
