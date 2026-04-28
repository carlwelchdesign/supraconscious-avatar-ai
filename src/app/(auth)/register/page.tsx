import { AuthForm } from "@/components/auth/auth-form"
import { registerAction } from "@/lib/auth/actions"
import { getCurrentUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <AuthForm mode="register" action={registerAction} />
    </main>
  )
}
