import assert from "node:assert/strict"
import test from "node:test"

import { buildPatternMemoryVisibilityUpdate } from "../src/lib/pattern-memory-feedback"

test("pattern suppress update is scoped to the owning user", () => {
  assert.deepEqual(
    buildPatternMemoryVisibilityUpdate({
      feedbackType: "suppress",
      patternMemoryId: "pattern-1",
      userId: "user-1",
    }),
    {
      where: { id: "pattern-1", userId: "user-1" },
      data: { active: false },
    },
  )
})

test("pattern restore update is scoped to the owning user", () => {
  assert.deepEqual(
    buildPatternMemoryVisibilityUpdate({
      feedbackType: "restore",
      patternMemoryId: "pattern-1",
      userId: "user-1",
    }),
    {
      where: { id: "pattern-1", userId: "user-1" },
      data: { active: true },
    },
  )
})

test("non-visibility feedback does not update pattern memory state", () => {
  assert.equal(
    buildPatternMemoryVisibilityUpdate({
      feedbackType: "helpful",
      patternMemoryId: "pattern-1",
      userId: "user-1",
    }),
    null,
  )
})
