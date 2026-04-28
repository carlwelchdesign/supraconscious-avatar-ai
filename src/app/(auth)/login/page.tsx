import { AuthForm } from "@/components/auth/auth-form"
import { loginAction } from "@/lib/auth/actions"
import { getCurrentUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return (
    <main className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--cream)" }}>
      {/* ambient */}
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #E8D5D5, transparent)" }} />
      <AuthForm mode="login" action={loginAction} />
    </main>
  )
}
