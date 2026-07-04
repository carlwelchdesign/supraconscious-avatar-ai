import { EmailRequestForm, TokenForm } from "@/components/auth/account-email-forms"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = readToken(params.token)

  return (
    <main className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--cream)" }}>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, #E8D5D5, transparent)" }} />
      {token ? <TokenForm mode="reset" token={token} /> : <EmailRequestForm mode="reset" />}
    </main>
  )
}

function readToken(value: string | undefined) {
  if (!value || value.length < 20 || value.length > 200) return ""
  return value.trim()
}
