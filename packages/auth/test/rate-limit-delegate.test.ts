import assert from "node:assert/strict"
import test from "node:test"
import {
  getUsableAuthRateLimitBucketDelegate,
  hasUsableAuthRateLimitWriteClient,
} from "../src/rate-limit-delegate"

test("auth rate-limit delegate is unavailable when generated client is stale", () => {
  assert.equal(getUsableAuthRateLimitBucketDelegate({}), null)
  assert.equal(getUsableAuthRateLimitBucketDelegate({ authRateLimitBucket: {} }), null)
})

test("auth rate-limit write client requires delegate and raw execution support", () => {
  const clientWithoutRaw = {
    authRateLimitBucket: { findMany: async () => [] },
  }
  const usableClient = {
    authRateLimitBucket: { findMany: async () => [] },
    $executeRaw: async () => 1,
  }

  assert.equal(hasUsableAuthRateLimitWriteClient(clientWithoutRaw), false)
  assert.equal(hasUsableAuthRateLimitWriteClient(usableClient), true)
})
