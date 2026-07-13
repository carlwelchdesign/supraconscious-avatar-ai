import assert from "node:assert/strict"
import { getSourceReadinessStatus } from "../src/lib/source-readiness"

const usableGrant = {
  status: "paraphrase_only",
  allowedUses: ["internal_retrieval", "paraphrase_generation"],
  quoteAllowed: false,
}

const approvedChunk = {
  reviewState: "approved",
  quotePermission: "paraphrase_only",
  safetyIntensity: "normal",
}

const baseSource = {
  reviewState: "approved",
  rightsStatus: "paraphrase_only",
  rightsGrants: [usableGrant],
  chunks: [approvedChunk],
  _count: { chunks: 1, sections: 1 },
}

assert.equal(
  getSourceReadinessStatus({ ...baseSource, _count: { chunks: 0, sections: 0 }, chunks: [] }),
  "not_parsed",
)

assert.equal(
  getSourceReadinessStatus({ ...baseSource, rightsGrants: [] }),
  "rights_pending",
)

assert.equal(
  getSourceReadinessStatus({ ...baseSource, reviewState: "blocked" }),
  "document_blocked",
)

assert.equal(
  getSourceReadinessStatus({ ...baseSource, chunks: [{ ...approvedChunk, reviewState: "parsed" }] }),
  "chunks_pending",
)

assert.equal(
  getSourceReadinessStatus(baseSource),
  "ready_for_rag",
)
