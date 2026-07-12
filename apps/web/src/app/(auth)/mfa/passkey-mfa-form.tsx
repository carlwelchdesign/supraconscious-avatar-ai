"use client"

import { startAuthentication } from "@simplewebauthn/browser"
import { useTranslations } from "next-intl"
import { useActionState, useState } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { verifyRecoveryCodeAction, type MfaRecoveryState } from "./actions"

export function PasskeyMfaForm() {
  const t = useTranslations("auth")
  const [status, setStatus] = useState<"idle" | "verifying">("idle")
  const [error, setError] = useState("")
  const [state, formAction, isPending] = useActionState<MfaRecoveryState, FormData>(verifyRecoveryCodeAction, {})

  async function verifyPasskey() {
    setStatus("verifying")
    setError("")
    try {
      const optionsResponse = await fetch("/api/auth/passkeys/authenticate/options", { method: "POST" })
      const options = await optionsResponse.json()
      if (!optionsResponse.ok) throw new Error(options.error ?? t("passkeyChallengeExpired"))

      const response = await startAuthentication({ optionsJSON: options.options })
      const verifyResponse = await fetch("/api/auth/passkeys/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken: options.challengeToken, response }),
      })
      const result = await verifyResponse.json()
      if (!verifyResponse.ok || !result.ok) throw new Error(result.error ?? t("passkeyVerificationFailed"))
      window.location.assign(result.redirectTo ?? "/dashboard")
    } catch (passkeyError) {
      setError(passkeyError instanceof Error ? passkeyError.message : t("passkeyVerificationFailed"))
    } finally {
      setStatus("idle")
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(155,175,155,0.14)] text-[var(--sage)]">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="font-display text-[32px] font-light leading-tight text-[var(--primary)]">
          {t("verifyPasskeyTitle")}
        </h1>
        <p className="mt-2 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
          {t("verifyPasskeyBody")}
        </p>
      </div>

      <div className="space-y-4 rounded-3xl border border-[rgba(43,27,53,0.08)] bg-[var(--pearl)] p-7 shadow-[0_8px_40px_rgba(43,27,53,0.07)]">
        {error ? (
          <p className="rounded-xl border border-[rgba(191,64,64,0.18)] bg-[rgba(191,64,64,0.07)] px-4 py-3 text-[13px] font-light text-[var(--destructive)]">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={verifyPasskey}
          disabled={status === "verifying"}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3.5 text-[14px] font-medium text-[var(--cream)] transition-all hover:-translate-y-px hover:bg-[var(--plum-mid)] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
        >
          {status === "verifying" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {t("usePasskey")}
        </button>

        <form action={formAction} className="space-y-3 border-t border-[rgba(43,27,53,0.08)] pt-4">
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium tracking-[0.04em] text-[var(--plum-soft)]">
              {t("recoveryCode")}
            </span>
            <input
              name="code"
              autoComplete="one-time-code"
              className="w-full rounded-xl border border-[rgba(43,27,53,0.1)] bg-[var(--cream)] px-4 py-3 text-[14px] font-light text-[var(--primary)] outline-none transition-colors focus:border-[var(--clay)]"
              placeholder="xxxx-xxxx-xxxx-xxxx"
            />
          </label>
          {state.error ? (
            <p className="text-[12px] font-light text-[var(--destructive)]">{state.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full border border-[rgba(43,27,53,0.12)] px-5 py-2.5 text-[13px] font-medium text-[var(--primary)] hover:bg-[rgba(43,27,53,0.04)] disabled:opacity-50"
          >
            {isPending ? t("checking") : t("useRecoveryCode")}
          </button>
        </form>
      </div>
    </div>
  )
}
