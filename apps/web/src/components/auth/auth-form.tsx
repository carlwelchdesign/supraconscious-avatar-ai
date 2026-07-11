"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useActionState } from "react"
import { Loader2, ArrowRight } from "lucide-react"
import type { AuthActionState } from "@inner-avatar/auth/actions"
import { AvatarOrb } from "@inner-avatar/ui/avatar-orb"
import { TurnstileWidget } from "./turnstile-widget"

type AuthFormProps = {
  mode: "login" | "register"
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>
  defaultEmail?: string
  nextPath?: string
}

export function AuthForm({ mode, action, defaultEmail = "", nextPath = "" }: AuthFormProps) {
  const t = useTranslations("auth")
  const [state, formAction, isPending] = useActionState(action, {})
  const isRegister = mode === "register"
  const alternateHref = buildAlternateHref(isRegister ? "/login" : "/register", defaultEmail, nextPath)

  return (
    <div className="w-full max-w-sm space-y-8">

      {/* Brand mark */}
      <div className="text-center">
        <AvatarOrb size="md" className="mx-auto mb-5" priority />
        <h1 className="font-display text-[32px] font-light text-[var(--primary)] leading-tight">
          {isRegister ? (
            <>{t("registerTitlePrimary")}<br /><em className="italic font-normal text-[var(--clay)]">{t("registerTitleAccent")}</em></>
          ) : (
            <>{t("loginTitlePrimary")}<br /><em className="italic font-normal text-[var(--clay)]">{t("loginTitleAccent")}</em></>
          )}
        </h1>
        <p className="mt-2 text-[13px] font-light text-[var(--plum-soft)]">
          {isRegister
            ? t("registerSubtitle")
            : t("loginSubtitle")}
        </p>
      </div>

      {/* Form */}
      <form
        action={formAction}
        className="space-y-4 rounded-3xl border p-7"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(43,27,53,0.08)",
          boxShadow: "0 8px 40px rgba(43,27,53,0.07)",
        }}
      >
        {nextPath && <input type="hidden" name="next" value={nextPath} />}
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {isRegister && (
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium tracking-[0.04em] text-[var(--plum-soft)]">
              {t("name")}
            </span>
            <input
              name="name"
              autoComplete="name"
              required
              className="w-full rounded-xl border px-4 py-3 text-[14px] font-light text-[var(--primary)] bg-[var(--cream)] outline-none focus:border-[var(--clay)] transition-colors"
              style={{ borderColor: "rgba(43,27,53,0.1)" }}
              placeholder={t("namePlaceholder")}
            />
          </label>
        )}

        <label className="block space-y-1.5">
          <span className="text-[12px] font-medium tracking-[0.04em] text-[var(--plum-soft)]">
            {t("email")}
          </span>
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

        <label className="block space-y-1.5">
          <span className="text-[12px] font-medium tracking-[0.04em] text-[var(--plum-soft)]">
            {t("password")}
          </span>
          <input
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? 8 : undefined}
            required
            className="w-full rounded-xl border px-4 py-3 text-[14px] font-light text-[var(--primary)] bg-[var(--cream)] outline-none focus:border-[var(--clay)] transition-colors"
            style={{ borderColor: "rgba(43,27,53,0.1)" }}
            placeholder="••••••••"
          />
        </label>

        {state.error && (
          <div
            className="rounded-xl px-4 py-3 text-[13px] font-light"
            style={{
              background: "rgba(191,64,64,0.07)",
              border: "1px solid rgba(191,64,64,0.18)",
              color: "var(--destructive)",
            }}
          >
            {state.error}
          </div>
        )}

        <TurnstileWidget />

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-[14px] font-medium px-6 py-3.5 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          {isRegister ? t("createAccount") : t("signIn")}
        </button>
      </form>

      <p className="text-center text-[13px] font-light text-[var(--plum-soft)]">
        {isRegister ? t("alreadyHaveAccount") : t("needAccount")}{" "}
        <Link
          href={alternateHref}
          className="font-medium text-[var(--primary)] underline-offset-4 hover:underline"
        >
          {isRegister ? t("signIn") : t("register")}
        </Link>
      </p>
      {!isRegister && (
        <div className="flex items-center justify-center gap-4 text-[12px] font-light text-[var(--plum-soft)]">
          <Link href={buildAlternateHref("/forgot-password", defaultEmail, "")} className="underline-offset-4 hover:underline">
            {t("forgotPassword")}
          </Link>
          <Link href={buildAlternateHref("/verify-email", defaultEmail, "")} className="underline-offset-4 hover:underline">
            {t("verifyEmail")}
          </Link>
        </div>
      )}
    </div>
  )
}

function buildAlternateHref(path: "/login" | "/register" | "/forgot-password" | "/verify-email", email: string, nextPath: string) {
  const params = new URLSearchParams()
  if (email) params.set("email", email)
  if (nextPath) params.set("next", nextPath)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}
