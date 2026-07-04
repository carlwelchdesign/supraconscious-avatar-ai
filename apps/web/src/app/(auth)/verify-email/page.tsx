import { EmailRequestForm, TokenForm } from "@/components/auth/account-email-forms"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>
}) {
  const params = await searchParams
  const token = readToken(params.token)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--cream)" }}>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #D8C9B8, transparent)" }} />
      {token ? <TokenForm mode="verify" token={token} /> : <EmailRequestForm mode="verify" defaultEmail={readDefaultEmail(params.email)} />}
    </main>
  )
}

function readDefaultEmail(value: string | undefined) {
  if (!value || value.length > 160 || !value.includes("@")) return ""
  return value.trim().toLowerCase()
}

function readToken(value: string | undefined) {
  if (!value || value.length < 20 || value.length > 200) return ""
  return value.trim()
}
