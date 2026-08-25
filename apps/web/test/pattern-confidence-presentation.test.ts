import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

test("web and mobile do not present the internal pattern-confidence heuristic", () => {
  const patternsPage = readFileSync(join(process.cwd(), "src/app/(app)/patterns/page.tsx"), "utf8")
  const mobileApp = readFileSync(join(process.cwd(), "../mobile/lib/src/app.dart"), "utf8")

  assert.equal(patternsPage.includes("ConfidenceBar"), false)
  assert.equal(patternsPage.includes("patternMessages.confidence"), false)
  assert.equal(patternsPage.includes("pattern.confidence"), false)
  assert.equal(mobileApp.includes("confidencePercent(confidence)"), false)
  assert.equal(mobileApp.includes("pattern.confidence * 100"), false)
})
