import { getCurrentUser } from "@inner-avatar/auth/session"
import { MobileReflectionPreferencesSchema, updateMobileReflectionPreferences } from "@/lib/mobile-auth"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser("web")
    if (!user) return privateJson({ error: "Unauthorized", code: "unauthorized" }, { status: 401 })

    const body = MobileReflectionPreferencesSchema.parse(await request.json())
    return privateJson(await updateMobileReflectionPreferences(user.id, body))
  } catch (error) {
    const apiError = readPrivateApiError(error, { fallback: "Unable to update reflection preferences." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
