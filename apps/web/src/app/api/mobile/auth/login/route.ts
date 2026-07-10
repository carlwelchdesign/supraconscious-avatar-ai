import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"
import { MobileLoginSchema, loginMobileUser } from "@/lib/mobile-auth"

export async function POST(request: Request) {
  try {
    const body = MobileLoginSchema.parse(await request.json())
    const result = await loginMobileUser(body)

    if (!result.ok) {
      return privateJson({ error: result.error }, { status: result.status })
    }

    return privateJson(result.body)
  } catch (error) {
    const apiError = readPrivateApiError(error, { fallback: "Unable to sign in." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
