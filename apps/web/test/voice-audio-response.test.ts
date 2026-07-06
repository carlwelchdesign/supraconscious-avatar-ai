import test from "node:test"
import assert from "node:assert/strict"
import { buildPrivateAudioResponse } from "../src/lib/voice/audio-response"

test("voice audio response is explicitly private and non-sniffable", () => {
  const response = buildPrivateAudioResponse(Buffer.from([1, 2, 3]))

  assert.equal(response.headers.get("Content-Type"), "audio/mpeg")
  assert.equal(response.headers.get("Content-Length"), "3")
  assert.equal(response.headers.get("Cache-Control"), "private, no-store")
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff")
})
