import assert from "node:assert/strict"
import test from "node:test"
import { readClientIpFromHeaders, readFirstIpFromHeader } from "../src/client-ip-core"

test("client IP parsing accepts the first valid forwarded address", () => {
  assert.equal(readFirstIpFromHeader("203.0.113.10, 10.0.0.4"), "203.0.113.10")
  assert.equal(readFirstIpFromHeader("unknown, 2001:db8::1"), "2001:db8::1")
  assert.equal(readFirstIpFromHeader("[2001:db8::2]:443"), "2001:db8::2")
  assert.equal(readFirstIpFromHeader("203.0.113.11:8080"), "203.0.113.11")
})

test("client IP parsing rejects malformed header values", () => {
  assert.equal(readFirstIpFromHeader("not an ip"), null)
  assert.equal(readFirstIpFromHeader("999.999.999.999"), null)
  assert.equal(readFirstIpFromHeader(""), null)
  assert.equal(readFirstIpFromHeader(null), null)
})

test("client IP reader falls back through trusted proxy headers", () => {
  const headers = new Map([
    ["x-forwarded-for", "unknown"],
    ["x-real-ip", "198.51.100.4"],
    ["cf-connecting-ip", "203.0.113.22"],
  ])

  assert.equal(readClientIpFromHeaders({ get: (name) => headers.get(name) ?? null }), "198.51.100.4")
})
