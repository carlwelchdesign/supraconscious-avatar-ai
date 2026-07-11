import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { isStripeConfigured } from "@inner-avatar/billing"
import { resolveWebLanguage } from "@/lib/language"
import { getWebMessages } from "@/lib/web-messages"
import { startCheckoutAction } from "./actions"

const plans = [
  {
    key: "free",
    featured: false,
  },
  {
    key: "starter",
    plan: "starter",
    featured: true,
  },
  {
    key: "pro",
    plan: "pro",
    featured: false,
  },
] as const

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const user = await getCurrentUser()
  const language = await resolveWebLanguage(user?.preferredLanguage)
  const pricing = getWebMessages(language).pricing
  const billingEnabled = isStripeConfigured()

  return (
    <main className="min-h-screen bg-[var(--cream)] px-6 py-10 text-[var(--primary)]">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-light text-[var(--plum-soft)] transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {pricing.back}
        </Link>

        <section className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--clay)]">
              {pricing.eyebrow}
            </p>
            <h1 className="mt-4 font-display text-[clamp(44px,6vw,72px)] font-light leading-[1.08] text-[var(--primary)]">
              {pricing.titleA}
              <br />
              <em className="font-normal italic text-[var(--clay)]">{pricing.titleB}</em>
            </h1>
          </div>
          <p className="max-w-xl text-[16px] font-light leading-[1.75] text-[var(--plum-soft)]">
            {pricing.body}
          </p>
        </section>

        <PricingStatus searchParams={searchParams} pricing={pricing} />
        {!billingEnabled ? (
          <div className="mt-8 rounded-2xl border px-5 py-4 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]" style={{ background: "rgba(184,137,90,0.08)", borderColor: "rgba(184,137,90,0.18)" }}>
            {pricing.billingDisabledNotice}
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const planMessages = pricing.plans[plan.key]
            const cadence = plan.key === "free" ? pricing.cadenceAlways : pricing.cadenceMonth
            return (
            <section
              key={plan.key}
              className="relative flex min-h-[420px] flex-col rounded-3xl border p-7"
              style={{
                background: plan.featured ? "var(--primary)" : "var(--pearl)",
                borderColor: plan.featured ? "var(--primary)" : "rgba(43,27,53,0.07)",
                boxShadow: plan.featured ? "0 18px 60px rgba(43,27,53,0.2)" : "0 8px 38px rgba(43,27,53,0.06)",
              }}
            >
              {plan.featured && (
                <span className="absolute right-5 top-5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em]" style={{ background: "rgba(184,137,90,0.2)", color: "var(--clay-light)" }}>
                  {pricing.recommended}
                </span>
              )}
              <div>
                <p className={plan.featured ? "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--clay-light)]" : "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--clay)]"}>
                  {planMessages.name}
                </p>
                <div className="mt-5 flex items-end gap-2">
                  <span className={plan.featured ? "font-display text-[56px] font-light leading-none text-[var(--cream)]" : "font-display text-[56px] font-light leading-none text-[var(--primary)]"}>
                    {planMessages.price}
                  </span>
                  <span className={plan.featured ? "pb-1 text-[13px] font-light text-[var(--cream)]/55" : "pb-1 text-[13px] font-light text-[var(--plum-soft)]"}>
                    / {cadence}
                  </span>
                </div>
                <p className={plan.featured ? "mt-5 text-[14px] font-light leading-relaxed text-[var(--cream)]/68" : "mt-5 text-[14px] font-light leading-relaxed text-[var(--plum-soft)]"}>
                  {planMessages.description}
                </p>
              </div>

              <ul className="mt-8 space-y-3">
                {planMessages.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ background: plan.featured ? "var(--clay-light)" : "var(--clay)" }}
                    />
                    <span className={plan.featured ? "text-[13px] font-light leading-relaxed text-[var(--cream)]/68" : "text-[13px] font-light leading-relaxed text-[var(--plum-soft)]"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                {"plan" in plan ? (
                  <form action={startCheckoutAction}>
                    <input type="hidden" name="plan" value={plan.plan} />
                    <button
                      type="submit"
                      disabled={!billingEnabled}
                      className={plan.featured
                        ? "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--clay)] px-5 py-3 text-[13px] font-medium text-[var(--cream)] transition-all hover:-translate-y-px hover:bg-[var(--clay-light)] disabled:cursor-not-allowed disabled:opacity-55"
                        : "inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-[13px] font-medium text-[var(--primary)] transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
                      }
                      style={plan.featured ? undefined : { borderColor: "rgba(43,27,53,0.1)" }}
                    >
                      {user ? planMessages.cta : pricing.signInFor.replace("{plan}", planMessages.name)}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {!billingEnabled ? (
                      <p className={plan.featured ? "mt-3 text-center text-[11px] font-light text-[var(--cream)]/45" : "mt-3 text-center text-[11px] font-light text-[var(--plum-soft)]/70"}>
                        {pricing.checkoutDisabled}
                      </p>
                    ) : null}
                  </form>
                ) : (
                  <Link
                    href={user ? "/journal" : "/register"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-[13px] font-medium text-[var(--primary)] transition-all hover:-translate-y-px"
                    style={{ borderColor: "rgba(43,27,53,0.1)" }}
                  >
                    {user ? pricing.continueFree : planMessages.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </section>
          )})}
        </div>
      </div>
    </main>
  )
}

async function PricingStatus({
  searchParams,
  pricing,
}: {
  searchParams: Promise<{ checkout?: string }>
  pricing: ReturnType<typeof getWebMessages>["pricing"]
}) {
  const params = await searchParams
  if (params.checkout !== "unavailable" && params.checkout !== "invalid-plan" && params.checkout !== "cancelled") {
    return null
  }

  const message = params.checkout === "invalid-plan"
    ? pricing.status.invalidPlan
    : params.checkout === "cancelled"
      ? pricing.status.cancelled
      : pricing.status.unavailable

  return (
    <div className="mt-8 rounded-2xl border px-5 py-4 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]" style={{ background: "rgba(184,137,90,0.08)", borderColor: "rgba(184,137,90,0.18)" }}>
      {message}
    </div>
  )
}
