import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { isStripeConfigured } from "@inner-avatar/billing"
import { startCheckoutAction } from "./actions"

const plans = [
  {
    name: "Free",
    price: "$0",
    cadence: "always",
    description: "A private place to start writing and receive grounded reflection.",
    features: ["Journal entries", "Safety-aware response handling", "Saved reflection history"],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Starter",
    price: "$9",
    cadence: "month",
    plan: "starter",
    description: "The core Inner Council loop for regular guided reflection.",
    features: ["Council reflections", "Personalized prompts", "Pattern memory", "Voice transcription"],
    cta: "Choose Starter",
    featured: true,
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "month",
    plan: "pro",
    description: "More continuity for deeper pattern review and sustained practice.",
    features: ["Everything in Starter", "Expanded pattern dashboard", "Guide progression", "Priority AI usage"],
    cta: "Choose Pro",
    featured: false,
  },
] as const

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const user = await getCurrentUser()
  const billingEnabled = isStripeConfigured()

  return (
    <main className="min-h-screen bg-[var(--cream)] px-6 py-10 text-[var(--primary)]">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-light text-[var(--plum-soft)] transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Supraconscious
        </Link>

        <section className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--clay)]">
              Plans
            </p>
            <h1 className="mt-4 font-display text-[clamp(44px,6vw,72px)] font-light leading-[1.08] text-[var(--primary)]">
              Choose your
              <br />
              <em className="font-normal italic text-[var(--clay)]">reflection rhythm.</em>
            </h1>
          </div>
          <p className="max-w-xl text-[16px] font-light leading-[1.75] text-[var(--plum-soft)]">
            Start privately, then upgrade when you want a richer Inner Council practice with memory, voice, progression, and deeper pattern review. Paid plans use Stripe Checkout and can be managed from settings.
          </p>
        </section>

        <PricingStatus searchParams={searchParams} />
        {!billingEnabled ? (
          <div className="mt-8 rounded-2xl border px-5 py-4 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]" style={{ background: "rgba(184,137,90,0.08)", borderColor: "rgba(184,137,90,0.18)" }}>
            Paid checkout is not enabled in this environment yet. The free reflection flow remains available.
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <section
              key={plan.name}
              className="relative flex min-h-[420px] flex-col rounded-3xl border p-7"
              style={{
                background: plan.featured ? "var(--primary)" : "var(--pearl)",
                borderColor: plan.featured ? "var(--primary)" : "rgba(43,27,53,0.07)",
                boxShadow: plan.featured ? "0 18px 60px rgba(43,27,53,0.2)" : "0 8px 38px rgba(43,27,53,0.06)",
              }}
            >
              {plan.featured && (
                <span className="absolute right-5 top-5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em]" style={{ background: "rgba(184,137,90,0.2)", color: "var(--clay-light)" }}>
                  Recommended
                </span>
              )}
              <div>
                <p className={plan.featured ? "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--clay-light)]" : "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--clay)]"}>
                  {plan.name}
                </p>
                <div className="mt-5 flex items-end gap-2">
                  <span className={plan.featured ? "font-display text-[56px] font-light leading-none text-[var(--cream)]" : "font-display text-[56px] font-light leading-none text-[var(--primary)]"}>
                    {plan.price}
                  </span>
                  <span className={plan.featured ? "pb-1 text-[13px] font-light text-[var(--cream)]/55" : "pb-1 text-[13px] font-light text-[var(--plum-soft)]"}>
                    / {plan.cadence}
                  </span>
                </div>
                <p className={plan.featured ? "mt-5 text-[14px] font-light leading-relaxed text-[var(--cream)]/68" : "mt-5 text-[14px] font-light leading-relaxed text-[var(--plum-soft)]"}>
                  {plan.description}
                </p>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
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
                      {user ? plan.cta : `Sign in for ${plan.name}`}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {!billingEnabled ? (
                      <p className={plan.featured ? "mt-3 text-center text-[11px] font-light text-[var(--cream)]/45" : "mt-3 text-center text-[11px] font-light text-[var(--plum-soft)]/70"}>
                        Paid checkout is currently disabled.
                      </p>
                    ) : null}
                  </form>
                ) : (
                  <Link
                    href={user ? "/journal" : "/register"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-[13px] font-medium text-[var(--primary)] transition-all hover:-translate-y-px"
                    style={{ borderColor: "rgba(43,27,53,0.1)" }}
                  >
                    {user ? "Continue Free" : plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}

async function PricingStatus({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const params = await searchParams
  if (params.checkout !== "unavailable" && params.checkout !== "invalid-plan" && params.checkout !== "cancelled") {
    return null
  }

  const message = params.checkout === "invalid-plan"
    ? "That plan was not recognized. Please choose one of the plans below."
    : params.checkout === "cancelled"
      ? "Checkout was cancelled. Nothing was changed."
      : "Paid checkout is not available in this environment yet. You can keep using the free reflection flow."

  return (
    <div className="mt-8 rounded-2xl border px-5 py-4 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]" style={{ background: "rgba(184,137,90,0.08)", borderColor: "rgba(184,137,90,0.18)" }}>
      {message}
    </div>
  )
}
