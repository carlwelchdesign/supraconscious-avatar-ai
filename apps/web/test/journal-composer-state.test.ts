import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import { resolveLivingFieldState, shouldAutosaveDraft } from "../src/lib/journal-composer-state"

test("living field follows interaction and safety state without reading private content", () => {
  assert.equal(resolveLivingFieldState({ hasText: false, isFocused: false, isSubmitting: false }), "resting")
  assert.equal(resolveLivingFieldState({ hasText: false, isFocused: true, isSubmitting: false }), "listening")
  assert.equal(resolveLivingFieldState({ hasText: true, isFocused: false, isSubmitting: false }), "listening")
  assert.equal(resolveLivingFieldState({ hasText: true, isFocused: false, isSubmitting: true }), "reflecting")
  assert.equal(resolveLivingFieldState({ hasText: true, isFocused: false, isSubmitting: true, safetySeverity: "high" }), "grounding")
})

test("autosave remains online and pauses during submission", () => {
  assert.equal(shouldAutosaveDraft({ text: "A private thought", isSubmitting: false, isOnline: true }), true)
  assert.equal(shouldAutosaveDraft({ text: "", isSubmitting: false, isOnline: true }), false)
  assert.equal(shouldAutosaveDraft({ text: "A private thought", isSubmitting: true, isOnline: true }), false)
  assert.equal(shouldAutosaveDraft({ text: "A private thought", isSubmitting: false, isOnline: false }), false)
})

test("living field is decorative, bounded, deterministic, and respects reduced motion", () => {
  const source = readFileSync(new URL("../src/components/ambient/living-field.tsx", import.meta.url), "utf8")
  assert.match(source, /aria-hidden="true"/)
  assert.match(source, /pointer-events-none/)
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(source, /visibilitychange/)
  assert.match(source, /IntersectionObserver/)
  assert.match(source, /targetModeRef/)
  assert.match(source, /motionQuery\.addEventListener\("change"/)
  assert.match(source, /\}, \[motionEnabled, seed\]\)/)
  assert.match(source, /Math\.min\(150/)
  assert.match(source, /Math\.min\(window\.devicePixelRatio \|\| 1, 1\.5\)/)
  assert.match(source, /seededRandom/)
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(/)
})
