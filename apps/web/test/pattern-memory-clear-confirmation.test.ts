import test from "node:test"
import assert from "node:assert/strict"
import { readPatternMemoryClearButtonLabel, readPatternMemoryClearHelperText } from "../src/lib/pattern-memory-clear-confirmation"

test("pattern memory clear confirmation starts unarmed", () => {
  assert.equal(readPatternMemoryClearButtonLabel(false), "Clear remembered signals")
  assert.match(readPatternMemoryClearHelperText(false), /keeps your journal entries/)
})

test("pattern memory clear confirmation explains future-use impact before submit", () => {
  assert.equal(readPatternMemoryClearButtonLabel(true), "Confirm clear")
  assert.match(readPatternMemoryClearHelperText(true), /future use/)
})
