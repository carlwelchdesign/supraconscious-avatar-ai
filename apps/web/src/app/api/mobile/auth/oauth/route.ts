import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"
import { loginMobileOAuth, MobileOAuthSchema } from "@/lib/mobile-auth"

export async function POST(request: Request) {
  try {
    const body = MobileOAuthSchema.parse(await request.json())
    const result = await loginMobileOAuth(body)

    return privateJson(result.body)
  } catch (error) {
    const apiError = readPrivateApiError(error, { fallback: "Unable to sign in with this provider." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
