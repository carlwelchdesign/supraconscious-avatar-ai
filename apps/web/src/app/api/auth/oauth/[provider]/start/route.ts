import { NextResponse } from "next/server"
import { createOAuthAuthorizationUrl, type OAuthProvider } from "@inner-avatar/auth/oauth"
import { requestOrigin } from "@/lib/request-origin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params
  if (!isOAuthProvider(provider)) return NextResponse.redirect(new URL("/login?oauth=unsupported", request.url))

  const url = new URL(request.url)
  const redirectTo = url.searchParams.get("next") ?? "/dashboard"
  const authorizationUrl = await createOAuthAuthorizationUrl({
    provider,
    origin: requestOrigin(request),
    redirectTo,
  })

  return NextResponse.redirect(authorizationUrl)
}

function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "apple"
}
