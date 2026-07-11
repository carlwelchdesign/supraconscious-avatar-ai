"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useActionState } from "react"
import { useTranslations } from "next-intl"
import { ArrowRight, Loader2 } from "lucide-react"
import type { AuthActionState } from "@inner-avatar/auth/actions"
import {
  requestEmailVerificationAction,
  requestPasswordResetAction,
  resetPasswordAction,
  verifyEmailAction,
} from "@inner-avatar/auth/actions"
import { TurnstileWidget } from "./turnstile-widget"

type EmailRequestFormProps = {
  mode: "verify" | "reset"
  defaultEmail?: string
}

type TokenFormProps = {
  mode: "verify" | "reset"
  token: string
}

export function EmailRequestForm({ mode, defaultEmail = "" }: EmailRequestFormProps) {
  const t = useTranslations("auth")
  const action = mode === "verify" ? requestEmailVerificationAction : requestPasswordResetAction
  const [state, formAction, isPending] = useActionState(action, {})
  const isVerify = mode === "verify"

  return (
    <AccountPanel
      title={isVerify ? t("verifyEmailTitle") : t("resetPassword")}
      description={isVerify ? t("verifyEmailDescription") : t("resetPasswordDescription")}
      state={state}
      backLabel={t("backToSignIn")}
    >
      <form action={formAction} className="space-y-4">
        <Honeypot />
        <label className="block space-y-1.5">
          <span className="text-[12px] font-medium tracking-[0.04em] text-[var(--plum-soft)]">{t("email")}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaultEmail}
            required
            className="w-full rounded-xl border px-4 py-3 text-[14px] font-light text-[var(--primary)] bg-[var(--cream)] outline-none focus:border-[var(--clay)] transition-colors"
            style={{ borderColor: "rgba(43,27,53,0.1)" }}
            placeholder="you@example.com"
          />
        </label>
        <TurnstileWidget />
        <SubmitButton pending={isPending}>{isVerify ? t("sendVerificationLink") : t("sendResetLink")}</SubmitButton>
      </form>
    </AccountPanel>
  )
}

export function TokenForm({ mode, token }: TokenFormProps) {
  const t = useTranslations("auth")
  const action = mode === "verify" ? verifyEmailAction : resetPasswordAction
  const [state, formAction, isPending] = useActionState(action, {})
  const isVerify = mode === "verify"

  return (
    <AccountPanel
      title={isVerify ? t("confirmEmail") : t("chooseNewPassword")}
      description={isVerify ? t("confirmEmailDescription") : t("chooseNewPasswordDescription")}
      state={state}
      backLabel={t("backToSignIn")}
    >
      <form action={formAction} className="space-y-4">
        <Honeypot />
        <input type="hidden" name="token" value={token} />
        {!isVerify && (
          <>
            <PasswordInput name="password" label={t("newPassword")} />
            <PasswordInput name="confirmPassword" label={t("confirmPassword")} />
          </>
        )}
        <TurnstileWidget />
        <SubmitButton pending={isPending}>{isVerify ? t("verifyEmail") : t("resetPassword")}</SubmitButton>
      </form>
    </AccountPanel>
  )
}

function AccountPanel({
  title,
  description,
  state,
  backLabel,
  children,
}: {
  title: string
  description: string
  state: AuthActionState
  backLabel: string
  children: ReactNode
}) {
  return (
    <div
      className="w-full max-w-sm space-y-5 rounded-3xl border p-7"
      style={{
        background: "var(--pearl)",
        borderColor: "rgba(43,27,53,0.08)",
        boxShadow: "0 8px 40px rgba(43,27,53,0.07)",
      }}
    >
      <div className="space-y-2 text-center">
        <h1 className="font-display text-[30px] font-light text-[var(--primary)]">{title}</h1>
        <p className="text-[13px] font-light text-[var(--plum-soft)]">{description}</p>
      </div>
      {state.error && <StateMessage tone="error">{state.error}</StateMessage>}
      {state.success && <StateMessage tone="success">{state.success}</StateMessage>}
      {children}
      <p className="text-center text-[13px] font-light text-[var(--plum-soft)]">
        <Link href="/login" className="font-medium text-[var(--primary)] underline-offset-4 hover:underline">
          {backLabel}
        </Link>
      </p>
    </div>
  )
}

function PasswordInput({ name, label }: { name: string; label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-medium tracking-[0.04em] text-[var(--plum-soft)]">{label}</span>
      <input
        name={name}
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        className="w-full rounded-xl border px-4 py-3 text-[14px] font-light text-[var(--primary)] bg-[var(--cream)] outline-none focus:border-[var(--clay)] transition-colors"
        style={{ borderColor: "rgba(43,27,53,0.1)" }}
        placeholder="••••••••"
      />
    </label>
  )
}

function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-[14px] font-medium px-6 py-3.5 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
      {children}
    </button>
  )
}

function StateMessage({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-[13px] font-light"
      style={{
        background: tone === "error" ? "rgba(191,64,64,0.07)" : "rgba(64,128,96,0.08)",
        border: tone === "error" ? "1px solid rgba(191,64,64,0.18)" : "1px solid rgba(64,128,96,0.18)",
        color: tone === "error" ? "var(--destructive)" : "var(--primary)",
      }}
    >
      {children}
    </div>
  )
}

function Honeypot() {
  return (
    <div className="hidden" aria-hidden="true">
      <label>
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}
