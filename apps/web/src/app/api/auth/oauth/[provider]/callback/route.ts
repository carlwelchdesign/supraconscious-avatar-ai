import { NextResponse } from "next/server"
import { handleOAuthCallback, type OAuthProvider } from "@inner-avatar/auth/oauth"
import { requestOrigin } from "@/lib/request-origin"

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  return handleCallback(request, context)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  return handleCallback(request, context)
}

async function handleCallback(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params
  if (!isOAuthProvider(provider)) return NextResponse.redirect(new URL("/login?oauth=unsupported", request.url))

  const values = request.method === "POST"
    ? new URLSearchParams(await request.text())
    : new URL(request.url).searchParams
  const code = values.get("code")
  const state = values.get("state")
  if (!code || !state) return NextResponse.redirect(new URL("/login?oauth=invalid", request.url))

  try {
    const result = await handleOAuthCallback({
      provider,
      origin: requestOrigin(request),
      code,
      state,
    })
    if (!result.ok) return NextResponse.redirect(new URL("/login?oauth=failed", request.url))
    return NextResponse.redirect(new URL(result.redirectTo, request.url))
  } catch {
    return NextResponse.redirect(new URL("/login?oauth=failed", request.url))
  }
}

function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "apple"
}
