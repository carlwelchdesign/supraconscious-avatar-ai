import assert from "node:assert/strict"
import test from "node:test"
import { buildPublicDimensionRationale } from "../src/lib/dimension-rationale"

test("public dimension rationale keeps useful signals while removing selector internals", () => {
  const rationale = buildPublicDimensionRationale({
    selectorVersion: "private-selector-version",
    doctrineVersion: "private-doctrine-version",
    policySource: "private-policy",
    safetyMode: "reflective",
    selected: [{
      dimension: "story",
      order: 1,
      depth: 2,
      reasonCodes: ["story_meaning_signal", "observer_vantage_available"],
      evidenceRefs: [{ source: "entry", signal: "private-signal" }],
    }],
  } as any, "reflection-1")

  assert.deepEqual(rationale, {
    reflectionSessionId: "reflection-1",
    mode: "reflective",
    selected: [{
      dimension: "story",
      order: 1,
      depth: 2,
      signals: ["meaning_and_perspective"],
    }],
  })
  const serialized = JSON.stringify(rationale)
  assert.equal(serialized.includes("private-selector-version"), false)
  assert.equal(serialized.includes("private-doctrine-version"), false)
  assert.equal(serialized.includes("private-policy"), false)
  assert.equal(serialized.includes("private-signal"), false)
})

test("public rationale stays absent during plain grounding or without selected dimensions", () => {
  assert.equal(buildPublicDimensionRationale({ safetyMode: "plain_grounding", selected: [] }), null)
  assert.equal(buildPublicDimensionRationale({ safetyMode: "reflective", selected: [] }), null)
})
