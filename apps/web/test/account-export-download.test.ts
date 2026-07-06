import { test } from "node:test"
import assert from "node:assert"
import { buildAccountExportFilename, buildAccountExportHeaders } from "../src/lib/account-export-download"

test("account export filename includes safe email and export date", () => {
  assert.equal(
    buildAccountExportFilename("CarlWelchDesign+Supra@gmail.com", "2026-07-06T12:34:56.000Z"),
    "supraconscious-account-export-carlwelchdesign+supra-gmail.com-2026-07-06.json",
  )
})

test("account export headers force a private download", () => {
  const headers = buildAccountExportHeaders("founder@example.com", "2026-07-06T12:34:56.000Z")

  assert.equal(headers["Cache-Control"], "private, no-store, max-age=0")
  assert.equal(headers["Content-Type"], "application/json; charset=utf-8")
  assert.equal(headers["Pragma"], "no-cache")
  assert.equal(headers["X-Content-Type-Options"], "nosniff")
  assert.equal(
    headers["Content-Disposition"],
    'attachment; filename="supraconscious-account-export-founder-example.com-2026-07-06.json"',
  )
})
