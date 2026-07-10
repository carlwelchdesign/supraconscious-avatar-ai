import { getCurrentUser } from "@inner-avatar/auth/session"
import { MobileConsentSchema, acceptMobileConsent } from "@/lib/mobile-auth"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser("web")
    if (!user) return privateJson({ error: "Unauthorized", code: "unauthorized" }, { status: 401 })

    const body = MobileConsentSchema.parse(await request.json())
    return privateJson(await acceptMobileConsent(user.id, body))
  } catch (error) {
    const apiError = readPrivateApiError(error, { fallback: "Unable to save consent." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
