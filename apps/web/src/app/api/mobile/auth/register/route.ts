import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"
import { MobileRegisterSchema, registerMobileUser } from "@/lib/mobile-auth"

export async function POST(request: Request) {
  try {
    const body = MobileRegisterSchema.parse(await request.json())
    const result = await registerMobileUser(body)

    if (!result.ok) {
      return privateJson({ error: result.error }, { status: result.status })
    }

    return privateJson(result.body)
  } catch (error) {
    const apiError = readPrivateApiError(error, { fallback: "Unable to create account." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
