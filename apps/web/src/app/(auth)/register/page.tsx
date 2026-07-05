import { AuthForm } from "@/components/auth/auth-form"
import { registerAction } from "@inner-avatar/auth/actions"
import { readPostLoginRedirect } from "@inner-avatar/auth/redirects"
import { choosePostAuthRedirect, readSafeNextPath } from "@inner-avatar/auth/safe-redirect"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { redirect } from "next/navigation"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(choosePostAuthRedirect(await readPostLoginRedirect(user), params.next))
  const defaultEmail = readDefaultEmail(params.email)
  const nextPath = readSafeNextPath(params.next)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--cream)" }}>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #D8C9B8, transparent)" }} />
      <AuthForm mode="register" action={registerAction} defaultEmail={defaultEmail} nextPath={nextPath} />
    </main>
  )
}

function readDefaultEmail(value: string | undefined) {
  if (!value || value.length > 160 || !value.includes("@")) return ""
  return value.trim().toLowerCase()
}
