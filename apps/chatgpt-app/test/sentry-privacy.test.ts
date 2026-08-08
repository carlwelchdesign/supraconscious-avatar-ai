import assert from "node:assert/strict"
import test from "node:test"
import { scrubSentryEvent } from "../src/lib/sentry-privacy.js"

test("ChatGPT Sentry event scrubbing excludes tool input and credentials", () => {
  const event = {
    user: { id: "private-user" },
    message: "private journal text",
    contexts: { private: { reflection: "private journal text" } },
    exception: { values: [{ type: "Error", value: "private journal text", stacktrace: { frames: [] } }] },
    extra: { input: "private journal text" },
    breadcrumbs: [{ message: "private journal text" }],
    request: {
      method: "POST",
      url: "https://api.example.com/mcp/tools/run?token=secret",
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
    url: "https://api.example.com/mcp/tools/run",
  })
})
