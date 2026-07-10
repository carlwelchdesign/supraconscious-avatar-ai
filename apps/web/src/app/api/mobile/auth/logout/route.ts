import { logoutMobileUser } from "@/lib/mobile-auth"
import { privateJson } from "@/lib/private-json"

export async function POST() {
  await logoutMobileUser()
  return privateJson({ ok: true })
}
