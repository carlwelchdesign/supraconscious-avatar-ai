import { createHash } from "node:crypto"

export function hashEmailForAudit(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
}
