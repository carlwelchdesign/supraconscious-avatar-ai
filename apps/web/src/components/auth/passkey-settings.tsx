"use client"

import { startRegistration } from "@simplewebauthn/browser"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react"

type Passkey = {
  id: string
  deviceLabel: string
  createdAt: string | Date
  lastUsedAt: string | Date | null
  credentialDeviceType: string | null
}

type PasskeySettingsProps = {
  initialPasskeys: Passkey[]
}

export function PasskeySettings({ initialPasskeys }: PasskeySettingsProps) {
  const t = useTranslations("settings.passkeys")
  const locale = useLocale()
  const [passkeys, setPasskeys] = useState(initialPasskeys)
  const [status, setStatus] = useState<"idle" | "enrolling" | "removing">("idle")
  const [message, setMessage] = useState("")
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const hasPasskeys = passkeys.length > 0
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }), [locale])

  async function refreshPasskeys() {
    const response = await fetch("/api/auth/passkeys")
    const body = await response.json()
    if (response.ok) setPasskeys(body.passkeys ?? [])
  }

  async function enrollPasskey() {
    setStatus("enrolling")
    setMessage("")
    setRecoveryCodes([])
    try {
      const optionsResponse = await fetch("/api/auth/passkeys/register/options", { method: "POST" })
      const options = await optionsResponse.json()
      if (!optionsResponse.ok) throw new Error(options.error ?? t("startEnrollmentError"))

      const response = await startRegistration({ optionsJSON: options.options })
      const verifyResponse = await fetch("/api/auth/passkeys/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken: options.challengeToken,
          response,
          deviceLabel: t("securityKeyLabel"),
        }),
      })
      const result = await verifyResponse.json()
      if (!verifyResponse.ok || !result.ok) throw new Error(result.error ?? t("enrollmentFailed"))

      setRecoveryCodes(result.recoveryCodes ?? [])
      setMessage(t("enrolledMessage"))
      await refreshPasskeys()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("enrollmentFailed"))
    } finally {
      setStatus("idle")
    }
  }

  async function remove(id: string) {
    const recoveryCode = passkeys.length <= 1
      ? window.prompt(t("removePrompt")) ?? ""
      : ""
    setStatus("removing")
    setMessage("")
    try {
      const response = await fetch("/api/auth/passkeys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: id, recoveryCode }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body.error ?? t("removeFailed"))
      setMessage(t("removedMessage"))
      await refreshPasskeys()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("removeFailed"))
    } finally {
      setStatus("idle")
    }
  }

  return (
    <div className="px-6 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[14px] font-medium text-[var(--primary)]">{t("title")}</p>
          <p className="mt-0.5 max-w-2xl text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
            {t("description")}
          </p>
        </div>
        <button
          type="button"
          onClick={enrollPasskey}
          disabled={status !== "idle"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)] disabled:opacity-50"
        >
          {status === "enrolling" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {t("addPasskey")}
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-[rgba(155,175,155,0.12)] px-4 py-3 text-[12px] font-medium text-[var(--sage)]">
          {message}
        </p>
      ) : null}

      {recoveryCodes.length ? (
        <div className="mt-4 rounded-xl border border-[rgba(184,137,90,0.24)] bg-[rgba(184,137,90,0.08)] p-4">
          <p className="text-[13px] font-medium text-[var(--primary)]">{t("saveRecoveryCodesTitle")}</p>
          <p className="mt-1 text-[12px] font-light text-[var(--plum-soft)]">
            {t("saveRecoveryCodesBody")}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {recoveryCodes.map((code) => (
              <code key={code} className="rounded-lg bg-white px-3 py-2 text-[12px] text-[var(--primary)]">
                {code}
              </code>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 divide-y border-t border-[rgba(43,27,53,0.07)]" style={{ borderColor: "rgba(43,27,53,0.07)" }}>
        {!hasPasskeys ? (
          <p className="py-5 text-[12px] font-light text-[var(--plum-soft)]">
            {t("none")}
          </p>
        ) : (
          passkeys.map((passkey) => (
            <div key={passkey.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-4 w-4 text-[var(--sage)]" />
                <div>
                  <p className="text-[13px] font-medium text-[var(--primary)]">{passkey.deviceLabel}</p>
                  <p className="mt-0.5 text-[11px] font-light text-[var(--plum-soft)]">
                    {t("added", { date: dateFormatter.format(new Date(passkey.createdAt)) })}
                    {passkey.lastUsedAt ? ` · ${t("lastUsed", { date: dateFormatter.format(new Date(passkey.lastUsedAt)) })}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(passkey.id)}
                disabled={status !== "idle"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(166,95,74,0.22)] px-3 py-1.5 text-[11px] font-medium text-[var(--clay)] hover:bg-[rgba(166,95,74,0.08)] disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("remove")}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
