import test from "node:test"
import assert from "node:assert/strict"
import { summarizeFounderCalibrationSourceTraces } from "../src/lib/founder-calibration-source-traces"

test("founder calibration source trace summary exposes provenance without raw journal text", () => {
  const summary = summarizeFounderCalibrationSourceTraces([
    {
      traceType: "retrieval",
      validationStatus: "selected",
      fallbackReason: null,
      sourceChunkId: "chunk-1",
      outputJson: {
        title: "Inner Council Doctrine",
        rank: 1,
        score: 12.5,
        matchReason: "Matched terms: council, protector",
        displayExcerpt: null,
      },
      sourceChunk: { sourceDocument: { title: "Fallback title" } },
    },
    {
      traceType: "retrieval",
      validationStatus: "no_eligible_source",
      fallbackReason: "No approved rights-compatible source chunks matched the entry.",
      sourceChunkId: null,
      outputJson: { selected: [] },
    },
    {
      traceType: "council",
      validationStatus: "pilot_validation_failed",
      fallbackReason: null,
      sourceChunkId: null,
      outputJson: {
        pilotValidation: {
          failedRules: ["citation_references_unretrieved_source"],
          warnings: ["rag_context_used_without_citations"],
        },
      },
    },
  ])

  assert.deepEqual(summary.selectedSources, [
    {
      chunkId: "chunk-1",
      title: "Inner Council Doctrine",
      rank: 1,
      score: 12.5,
      matchReason: "Matched terms: council, protector",
      displayExcerptSuppressed: true,
    },
  ])
  assert.deepEqual(summary.fallbackReasons, ["No approved rights-compatible source chunks matched the entry."])
  assert.deepEqual(summary.validationIssues, [
    "citation_references_unretrieved_source",
    "rag_context_used_without_citations",
  ])
  assert.equal(JSON.stringify(summary).includes("journal"), false)
})
