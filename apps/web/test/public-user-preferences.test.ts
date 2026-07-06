import { test } from "node:test"
import assert from "node:assert"
import { assertPublicUserPreferences, PUBLIC_USER_PREFERENCES_SELECT } from "../src/lib/public-user-preferences"

test("public user preference projection excludes auth and admin fields", () => {
  const selectedFields = Object.keys(PUBLIC_USER_PREFERENCES_SELECT)

  assert.equal(selectedFields.includes("passwordHash"), false)
  assert.equal(selectedFields.includes("role"), false)
  assert.equal(selectedFields.includes("tokenHash"), false)
})

test("public user preference assertion rejects unsafe fields", () => {
  assert.doesNotThrow(() => assertPublicUserPreferences({ id: "user_1", avatarTone: "balanced" }))
  assert.throws(
    () => assertPublicUserPreferences({ id: "user_1", passwordHash: "hashed-secret" }),
    /Unsafe public user preference field/,
  )
})
