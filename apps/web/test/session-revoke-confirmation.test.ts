import assert from "node:assert/strict"
import test from "node:test"
import { readSessionRevokeAllButtonLabel, readSessionRevokeAllHelperText } from "../src/lib/session-revoke-confirmation"

test("session revoke-all confirmation starts unarmed", () => {
  assert.equal(readSessionRevokeAllButtonLabel(false), "Sign out everywhere")
  assert.match(readSessionRevokeAllHelperText(false), /Select Sign out everywhere once/)
})

test("session revoke-all confirmation explains account-wide sign out before submit", () => {
  assert.equal(readSessionRevokeAllButtonLabel(true), "Confirm sign out")
  assert.match(readSessionRevokeAllHelperText(true), /every active web and admin session/)
})
