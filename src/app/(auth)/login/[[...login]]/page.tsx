import { SignIn } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAuthConfigurationMessage, isClerkConfigured, isLocalDemoAuthEnabled } from "@/lib/auth/config"

export default function LoginPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Account Login</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{getAuthConfigurationMessage()}</p>
          {isLocalDemoAuthEnabled() ? (
            <Button asChild className="mt-5">
              <Link href="/journal">Open Demo Journal</Link>
            </Button>
          ) : null}
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <SignIn />
    </main>
  )
}
