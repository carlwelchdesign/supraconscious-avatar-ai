import { readPendingAuthChallenge } from "@inner-avatar/auth/pending-auth"
import { redirect } from "next/navigation"
import { PasskeyMfaForm } from "./passkey-mfa-form"

export default async function MfaPage() {
  const pending = await readPendingAuthChallenge({ type: "mfa" })
  if (!pending?.userId) redirect("/login")

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-6 py-12">
      <PasskeyMfaForm />
    </main>
  )
}
