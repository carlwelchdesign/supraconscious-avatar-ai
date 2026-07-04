import { EmailRequestForm } from "@/components/auth/account-email-forms"

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--cream)" }}>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #E8D5D5, transparent)" }} />
      <EmailRequestForm mode="reset" defaultEmail={readDefaultEmail(params.email)} />
    </main>
  )
}

function readDefaultEmail(value: string | undefined) {
  if (!value || value.length > 160 || !value.includes("@")) return ""
  return value.trim().toLowerCase()
}
