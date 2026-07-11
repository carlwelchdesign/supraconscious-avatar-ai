import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowDown, ArrowRight, Shield, Sparkles, Telescope, VenetianMask } from "lucide-react"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { resolveWebLanguage, supportedLanguageOptions } from "@/lib/language"
import { getWebMessages } from "@/lib/web-messages"

const councilIcons = [Shield, VenetianMask, Telescope, Sparkles]

function CtaLink({ href, children, variant = "dark" }: { href: string; children: ReactNode; variant?: "dark" | "light" }) {
  const className =
    variant === "light"
      ? "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-[var(--cream)] px-6 py-3 text-sm font-medium text-[var(--primary)] shadow-[0_16px_48px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[var(--pearl)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)] focus:ring-offset-2 focus:ring-offset-[var(--primary)]"
      : "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--cream)] shadow-[0_16px_48px_rgba(43,27,53,0.20)] transition hover:-translate-y-0.5 hover:bg-[var(--plum-mid)] focus:outline-none focus:ring-2 focus:ring-[var(--clay)] focus:ring-offset-2 focus:ring-offset-[var(--cream)]"

  return (
    <Link href={href} className={className}>
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  )
}

export default async function Home() {
  const user = await getCurrentUser()
  const currentLanguage = await resolveWebLanguage(user?.preferredLanguage)
  const messages = getWebMessages(currentLanguage)
  const common = messages.common
  const landing = messages.landing
  const primaryHref = user ? "/journal" : "/register"
  const primaryCta = user ? common.continueReflection : common.startReflection
  const finalCta = user ? common.continueReflection : landing.finalCta

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--cream)] text-[var(--primary)]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[rgba(26,16,32,0.58)] px-5 py-4 text-[var(--cream)] backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 md:gap-4">
          <Link href="/" className="font-display text-xl font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)]">
            {landing.brand}
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Landing page sections">
            {[
              ["Problem", "#problem"],
              ["Council", "#council"],
              ["Experience", "#experience"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-[var(--cream)]/72 transition hover:text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)]"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 items-center gap-1 rounded-full border border-white/15 bg-white/10 px-1.5"
              aria-label={common.language}
            >
              {supportedLanguageOptions().map((language) => {
                const active = language.code === currentLanguage
                return (
                  <Link
                    key={language.code}
                    href={`/language?lang=${language.code}&next=/`}
                    title={language.nativeLabel}
                    aria-label={language.nativeLabel}
                    aria-current={active ? "true" : undefined}
                    className={
                      active
                        ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--cream)] text-base shadow-sm ring-1 ring-white/60"
                        : "inline-flex h-7 w-7 items-center justify-center rounded-full text-base opacity-70 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)]"
                    }
                  >
                    <span aria-hidden="true">{language.flag}</span>
                  </Link>
                )
              })}
            </div>
            <Link
              href={primaryHref}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-4 py-2 text-sm font-medium text-[var(--primary)] transition hover:-translate-y-px hover:bg-[var(--pearl)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)]"
            >
              {user ? common.openJournal : common.begin}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[92vh] overflow-hidden bg-[var(--primary)] px-5 pb-20 pt-32 text-[var(--cream)] md:px-8 lg:min-h-screen lg:pb-28 lg:pt-36">
        <Image
          src="/landing/echo-eye-cosmos.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-[0.78]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(26,16,32,0.92) 0%, rgba(26,16,32,0.74) 42%, rgba(26,16,32,0.40) 100%), linear-gradient(180deg, rgba(26,16,32,0.24) 0%, rgba(26,16,32,0.80) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto flex min-h-[calc(92vh-10rem)] max-w-7xl flex-col justify-end lg:min-h-[calc(100vh-10rem)]">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-[var(--clay-light)]">
              {landing.eyebrow}
            </p>
            <h1 className="font-display text-[clamp(54px,8vw,112px)] font-light leading-[0.96] text-[var(--cream)]">
              {landing.brand}
            </h1>
            <div className="mt-8 max-w-2xl space-y-3 font-display text-[clamp(30px,4vw,54px)] font-light leading-[1.1] text-[var(--cream)]">
              <p>{landing.notJournal}</p>
              <p className="italic text-[var(--clay-light)]">{landing.meetYourself}</p>
            </div>
            <p className="mt-7 max-w-xl text-[17px] font-light leading-[1.75] text-[var(--cream)]/78">
              {landing.heroBody}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <CtaLink href={primaryHref} variant="light">
                {primaryCta}
              </CtaLink>
              <Link
                href="#problem"
                className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-[var(--cream)]/72 transition hover:text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)]"
              >
                {landing.seeWhatChanges}
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="px-5 py-24 md:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">{landing.problem}</p>
            <h2 className="font-display text-[clamp(38px,5vw,68px)] font-light leading-[1.05] text-[var(--primary)]">
              {landing.problemTitleA}
              <br />
              <span className="italic text-[var(--clay)]">{landing.problemTitleB}</span>
            </h2>
          </div>
          <div className="max-w-2xl space-y-7 text-[18px] font-light leading-[1.82] text-[var(--plum-soft)]">
            <p>{landing.problemBody1}</p>
            <div className="grid gap-3 border-l border-[var(--clay)]/30 pl-6 font-display text-3xl font-light leading-tight text-[var(--primary)] md:grid-cols-3 md:border-l-0 md:pl-0">
              {landing.problemSignals.map((signal) => (
                <span key={signal}>{signal}</span>
              ))}
            </div>
            <p>{landing.problemBody2}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--pearl)] px-5 py-24 md:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">{landing.shiftEyebrow}</p>
            <h2 className="font-display text-[clamp(38px,4.8vw,64px)] font-light leading-[1.08]">
              {landing.shiftTitle}
            </h2>
          </div>
          <div className="space-y-6 text-[17px] font-light leading-[1.8] text-[var(--plum-soft)]">
            <p>{landing.shiftBody}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {landing.shiftParts.map((item) => (
                <div key={item} className="border-t border-[var(--clay)]/25 pt-4 text-[15px] text-[var(--primary)]">
                  {item}
                </div>
              ))}
            </div>
            <p>{landing.shiftClosing}</p>
          </div>
        </div>
      </section>

      <section id="council" className="px-5 py-24 md:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">{landing.council}</p>
            <h2 className="font-display text-[clamp(42px,5.5vw,74px)] font-light leading-[1.03]">
              {landing.councilTitle}
            </h2>
            <p className="mt-6 max-w-xl text-[17px] font-light leading-[1.75] text-[var(--plum-soft)]">
              {landing.councilBody}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {landing.councilRoles.map(({ title, body }, index) => {
              const Icon = councilIcons[index] ?? Shield
              return (
              <article
                key={title}
                className="min-h-56 rounded-lg border border-[var(--border)] bg-[var(--pearl)] p-6 shadow-[0_12px_40px_rgba(43,27,53,0.06)]"
              >
                <Icon className="mb-7 h-7 w-7 text-[var(--clay)]" aria-hidden="true" strokeWidth={1.5} />
                <h3 className="font-display text-3xl font-light text-[var(--primary)]">{title}</h3>
                <p className="mt-4 text-[15px] font-light leading-relaxed text-[var(--plum-soft)]">{body}</p>
              </article>
              )
            })}
          </div>

          <div className="mt-16 max-w-4xl border-l border-[var(--clay)]/40 pl-7">
            <p className="font-display text-[clamp(32px,4vw,52px)] font-light leading-[1.12] text-[var(--primary)]">
              {landing.changeQuestionTitle}
            </p>
            <p className="mt-5 max-w-2xl text-[17px] font-light leading-[1.75] text-[var(--plum-soft)]">
              {landing.changeQuestionBody}
            </p>
          </div>
        </div>
      </section>

      <section id="experience" className="bg-[var(--primary)] px-5 py-24 text-[var(--cream)] md:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay-light)]">{landing.experience}</p>
              <h2 className="font-display text-[clamp(40px,5vw,70px)] font-light leading-[1.05]">
                {landing.experienceTitleA}
                <br />
                <span className="italic text-[var(--clay-light)]">{landing.experienceTitleB}</span>
              </h2>
            </div>
            <p className="max-w-2xl text-[17px] font-light leading-[1.8] text-[var(--cream)]/70">
              {landing.experienceBody}
            </p>
          </div>
          <div className="mt-14 grid gap-3 md:grid-cols-5">
            {landing.experienceSteps.map((step, index) => (
              <div key={step} className="border-t border-[var(--cream)]/20 pt-5">
                <span className="text-xs font-medium text-[var(--clay-light)]">0{index + 1}</span>
                <p className="mt-3 font-display text-3xl font-light">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 md:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">{landing.whyEyebrow}</p>
            <h2 className="font-display text-[clamp(40px,5vw,70px)] font-light leading-[1.05]">
              {landing.whyTitle}
            </h2>
            <p className="mt-7 max-w-xl text-[17px] font-light leading-[1.8] text-[var(--plum-soft)]">
              {landing.whyBody}
            </p>
          </div>
          <div className="bg-[var(--pearl)] p-8 shadow-[0_14px_48px_rgba(43,27,53,0.07)] md:p-10">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">{landing.dailyEyebrow}</p>
            <h3 className="font-display text-4xl font-light leading-tight">{landing.dailyTitle}</h3>
            <div className="mt-8 grid gap-5 text-[15px] font-light leading-relaxed text-[var(--plum-soft)]">
              <p>{landing.dailyBody1}</p>
              <p>{landing.dailyBody2}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--pearl)] px-5 py-24 md:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">{landing.differentEyebrow}</p>
            <h2 className="font-display text-[clamp(38px,5vw,64px)] font-light leading-[1.08]">
              {landing.differentTitle}
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--plum-soft)]">{landing.notThisLabel}</p>
              <div className="space-y-3">
                {landing.notThis.map((item) => (
                  <p key={item} className="text-[17px] font-light text-[var(--plum-soft)]">× {item}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">{landing.thisIsLabel}</p>
              <div className="space-y-3">
                {landing.thisIs.map((item) => (
                  <p key={item} className="text-[17px] font-medium text-[var(--primary)]">→ {item}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl border-y border-[var(--clay)]/25 py-12 text-center">
          <p className="mx-auto max-w-3xl font-display text-[clamp(30px,4vw,50px)] font-light leading-[1.18] text-[var(--primary)]">
            {landing.trustStatement}
          </p>
          <p className="mt-5 text-sm font-light text-[var(--plum-soft)]">{landing.trustSubtext}</p>
        </div>
      </section>

      <section className="bg-[var(--primary)] px-5 py-28 text-center text-[var(--cream)] md:px-8 lg:py-36">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-[clamp(46px,6vw,86px)] font-light leading-[1.02]">
            {landing.finalTitleA}
            <br />
            <span className="italic text-[var(--clay-light)]">{landing.finalTitleB}</span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-[17px] font-light leading-[1.8] text-[var(--cream)]/72">
            {landing.finalBody}
          </p>
          <div className="mt-10">
            <CtaLink href={primaryHref} variant="light">
              {finalCta}
            </CtaLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--cream)]/10 bg-[var(--primary)] px-5 py-10 text-[var(--cream)] md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="font-display text-lg font-light tracking-wide text-[var(--cream)]/55">{landing.footerBrand}</span>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[13px] font-light text-[var(--cream)]/38">
            <span>{landing.footerPrivate}</span>
            <span>{landing.footerSafety}</span>
            <span>{landing.footerGrounded}</span>
          </div>
          <span className="text-xs text-[var(--cream)]/25">© {new Date().getFullYear()} Supraconscious</span>
        </div>
      </footer>
    </main>
  )
}
