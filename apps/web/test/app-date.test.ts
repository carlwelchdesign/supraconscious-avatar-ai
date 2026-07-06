import { test } from "node:test"
import assert from "node:assert"
import { getAppCalendarDate, getAppHour, resolveAppTimeZone } from "../src/lib/date-format"

test("app calendar date uses the configured timezone for daily curriculum lookup", () => {
  const instant = new Date("2026-07-06T06:30:00.000Z")

  const losAngeles = getAppCalendarDate(instant, "America/Los_Angeles")
  const utc = getAppCalendarDate(instant, "UTC")

  assert.equal(losAngeles.month, 7)
  assert.equal(losAngeles.day, 5)
  assert.equal(losAngeles.label, "Sunday, July 5")
  assert.equal(utc.month, 7)
  assert.equal(utc.day, 6)
  assert.equal(utc.label, "Monday, July 6")
})

test("app timezone falls back to Los Angeles when unset or invalid", () => {
  assert.equal(resolveAppTimeZone(""), "America/Los_Angeles")
  assert.equal(resolveAppTimeZone("Not/A_Timezone"), "America/Los_Angeles")
})

test("app hour uses the configured timezone for dashboard greetings", () => {
  const instant = new Date("2026-07-06T06:30:00.000Z")

  assert.equal(getAppHour(instant, "America/Los_Angeles"), 23)
  assert.equal(getAppHour(instant, "UTC"), 6)
})
