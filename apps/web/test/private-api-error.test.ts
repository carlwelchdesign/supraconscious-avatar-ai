import { test } from "node:test"
import assert from "node:assert/strict"
import { z } from "zod"
import { readPrivateApiError } from "../src/lib/private-api-error"

test("private API errors expose validation messages", () => {
  const parsed = z.object({ text: z.string().min(20, "Write more first.") }).safeParse({ text: "short" })
  assert.equal(parsed.success, false)
  if (parsed.success) return

  assert.deepEqual(readPrivateApiError(parsed.error, { fallback: "Unable to reflect." }), {
    error: "Write more first.",
    status: 400,
  })
})

test("private API errors keep unexpected internals generic", () => {
  assert.deepEqual(readPrivateApiError(new Error("Database connection string leaked"), { fallback: "Unable to reflect.", status: 500 }), {
    error: "Unable to reflect.",
    status: 500,
  })
})

test("private API errors preserve unauthorized status", () => {
  assert.deepEqual(readPrivateApiError(new Error("Unauthorized"), { fallback: "Unable to reflect." }), {
    error: "Unauthorized",
    status: 401,
  })
})
