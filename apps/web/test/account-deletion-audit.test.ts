import { test } from "node:test"
import assert from "node:assert"
import { buildAccountDeletionAuditMetadata, hashAccountEmailForAudit } from "../src/lib/account-deletion-audit"

test("account deletion audit metadata keeps a stable email hash without raw email", () => {
  const metadata = buildAccountDeletionAuditMetadata({
    email: " CarlWelchDesign+Supra@gmail.com ",
    stripeCleanup: { stripeConfigured: true, customerDeleted: true, canceledSubscriptions: 1 },
  })

  assert.equal(metadata.emailHash, hashAccountEmailForAudit("carlwelchdesign+supra@gmail.com"))
  assert.equal(metadata.selfService, true)
  assert.deepEqual(metadata.stripeCleanup, { stripeConfigured: true, customerDeleted: true, canceledSubscriptions: 1 })
  assert.equal(JSON.stringify(metadata).includes("CarlWelchDesign+Supra@gmail.com"), false)
  assert.equal(JSON.stringify(metadata).includes("carlwelchdesign+supra@gmail.com"), false)
})
