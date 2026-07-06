import { test } from "node:test"
import assert from "node:assert/strict"
import { readFounderReviewSummary } from "../src/lib/founder-review-summary"

test("founder review summary is quiet before admin review", () => {
  assert.equal(readFounderReviewSummary({ reviewLabel: null, reviewSeverity: null }), null)
})

test("founder review summary recognizes ready and strong evidence labels", () => {
  assert.equal(
    readFounderReviewSummary({ reviewLabel: "ready" }),
    "Admin review marked this as ready. It can serve as a golden example for future guide tuning.",
  )
  assert.equal(
    readFounderReviewSummary({ reviewLabel: "source_good" }),
    "Admin review marked this session as strong calibration evidence.",
  )
})

test("founder review summary prioritizes blocker severity", () => {
  assert.equal(
    readFounderReviewSummary({ reviewLabel: "ready", reviewSeverity: "pilot_blocker" }),
    "Admin review marked this session as needing attention before it becomes useful calibration evidence.",
  )
})

test("founder review summary explains issue labels", () => {
  assert.equal(readFounderReviewSummary({ reviewLabel: "voice_wrong" }), "Admin review marked a voice issue for prompt tuning.")
  assert.equal(readFounderReviewSummary({ reviewLabel: "source_unsupported" }), "Admin review marked a source grounding issue.")
  assert.equal(readFounderReviewSummary({ reviewLabel: "embodiment_weak" }), "Admin review marked the embodiment guidance as weak.")
  assert.equal(readFounderReviewSummary({ reviewLabel: "too_intense" }), "Admin review marked this response as too intense.")
})
