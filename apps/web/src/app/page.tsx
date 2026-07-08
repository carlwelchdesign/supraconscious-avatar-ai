import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowDown, ArrowRight, Shield, Sparkles, Telescope, VenetianMask } from "lucide-react"
import { getCurrentUser } from "@inner-avatar/auth/session"

const councilRoles = [
  {
    icon: Shield,
    title: "The Protector",
    body: "Shows where fear is holding you back.",
  },
  {
    icon: VenetianMask,
    title: "The Conditioned Self",
    body: "Reveals patterns you did not question.",
  },
  {
    icon: Telescope,
    title: "The Visionary",
    body: "Shows who you are becoming.",
  },
  {
    icon: Sparkles,
    title: "The Truth Self",
    body: "Cuts through illusion.",
  },
]

const experienceSteps = ["Write", "See", "Face", "Choose", "Become"]

const notThis = ["a journaling app", "a chatbot", "a coaching tool"]
const thisIs = ["an identity reflection system", "a decision clarity engine", "a mirror for your becoming"]

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
  const primaryHref = user ? "/journal" : "/register"
  const primaryCta = user ? "Continue Your Reflection" : "Start Your First Reflection"
  const finalCta = user ? "Continue Your Reflection" : "Begin Your First Reflection"

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--cream)] text-[var(--primary)]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[rgba(26,16,32,0.58)] px-5 py-4 text-[var(--cream)] backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="font-display text-xl font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)]">
            The Inner Council™
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
          <Link
            href={primaryHref}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[var(--cream)] px-4 py-2 text-sm font-medium text-[var(--primary)] transition hover:-translate-y-px hover:bg-[var(--pearl)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)]"
          >
            {user ? "Open journal" : "Begin"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
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
              AI-powered identity reflection
            </p>
            <h1 className="font-display text-[clamp(54px,8vw,112px)] font-light leading-[0.96] text-[var(--cream)]">
              The Inner Council™
            </h1>
            <div className="mt-8 max-w-2xl space-y-3 font-display text-[clamp(30px,4vw,54px)] font-light leading-[1.1] text-[var(--cream)]">
              <p>This is not a journal.</p>
              <p className="italic text-[var(--clay-light)]">This is where you meet yourself.</p>
            </div>
            <p className="mt-7 max-w-xl text-[17px] font-light leading-[1.75] text-[var(--cream)]/78">
              You do not need more advice. You need to see clearly. The Inner Council™ reveals what you already know, but have not faced.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <CtaLink href={primaryHref} variant="light">
                {primaryCta}
              </CtaLink>
              <Link
                href="#problem"
                className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-[var(--cream)]/72 transition hover:text-[var(--cream)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)]"
              >
                See what changes
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="px-5 py-24 md:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">The problem</p>
            <h2 className="font-display text-[clamp(38px,5vw,68px)] font-light leading-[1.05] text-[var(--primary)]">
              You are not stuck.
              <br />
              <span className="italic text-[var(--clay)]">You are not seeing clearly.</span>
            </h2>
          </div>
          <div className="max-w-2xl space-y-7 text-[18px] font-light leading-[1.82] text-[var(--plum-soft)]">
            <p>You have thought about it. Analyzed it. Replayed it. And still, something in you hesitates.</p>
            <div className="grid gap-3 border-l border-[var(--clay)]/30 pl-6 font-display text-3xl font-light leading-tight text-[var(--primary)] md:grid-cols-3 md:border-l-0 md:pl-0">
              <span>you hesitate</span>
              <span>you delay</span>
              <span>you stay</span>
            </div>
            <p>
              Not because you do not know what to do. Because something in you is pulling in different directions.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--pearl)] px-5 py-24 md:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">The shift</p>
            <h2 className="font-display text-[clamp(38px,4.8vw,64px)] font-light leading-[1.08]">
              What if you could see every part of yourself at once?
            </h2>
          </div>
          <div className="space-y-6 text-[17px] font-light leading-[1.8] text-[var(--plum-soft)]">
            <p>Inside you, there is not one voice. There are many.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["the part that wants safety", "the part that repeats the past", "the part that knows your potential", "the part that sees the truth"].map((item) => (
                <div key={item} className="border-t border-[var(--clay)]/25 pt-4 text-[15px] text-[var(--primary)]">
                  {item}
                </div>
              ))}
            </div>
            <p>Most people hear noise. This system gives you structure.</p>
          </div>
        </div>
      </section>

      <section id="council" className="px-5 py-24 md:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">How it works</p>
            <h2 className="font-display text-[clamp(42px,5.5vw,74px)] font-light leading-[1.03]">
              Meet Your Inner Council™
            </h2>
            <p className="mt-6 max-w-xl text-[17px] font-light leading-[1.75] text-[var(--plum-soft)]">
              You write what is on your mind. Then four inner lenses reflect what is moving beneath the surface.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {councilRoles.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="min-h-56 rounded-lg border border-[var(--border)] bg-[var(--pearl)] p-6 shadow-[0_12px_40px_rgba(43,27,53,0.06)]"
              >
                <Icon className="mb-7 h-7 w-7 text-[var(--clay)]" aria-hidden="true" strokeWidth={1.5} />
                <h3 className="font-display text-3xl font-light text-[var(--primary)]">{title}</h3>
                <p className="mt-4 text-[15px] font-light leading-relaxed text-[var(--plum-soft)]">{body}</p>
              </article>
            ))}
          </div>

          <div className="mt-16 max-w-4xl border-l border-[var(--clay)]/40 pl-7">
            <p className="font-display text-[clamp(32px,4vw,52px)] font-light leading-[1.12] text-[var(--primary)]">
              And then you face the question that changes everything.
            </p>
            <p className="mt-5 max-w-2xl text-[17px] font-light leading-[1.75] text-[var(--plum-soft)]">
              Not advice. Not answers. One precise question that reveals what you have been avoiding.
            </p>
          </div>
        </div>
      </section>

      <section id="experience" className="bg-[var(--primary)] px-5 py-24 text-[var(--cream)] md:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay-light)]">The experience</p>
              <h2 className="font-display text-[clamp(40px,5vw,70px)] font-light leading-[1.05]">
                This is not about writing.
                <br />
                <span className="italic text-[var(--clay-light)]">It is about seeing.</span>
              </h2>
            </div>
            <p className="max-w-2xl text-[17px] font-light leading-[1.8] text-[var(--cream)]/70">
              Every session moves through a simple path. No noise. No overwhelm. No endless scrolling. Just clarity.
            </p>
          </div>
          <div className="mt-14 grid gap-3 md:grid-cols-5">
            {experienceSteps.map((step, index) => (
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
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">Why it works</p>
            <h2 className="font-display text-[clamp(40px,5vw,70px)] font-light leading-[1.05]">
              Because clarity changes behavior.
            </h2>
            <p className="mt-7 max-w-xl text-[17px] font-light leading-[1.8] text-[var(--plum-soft)]">
              Not motivation. Not discipline. Clarity. When you see your patterns, contradictions, and truth, you do not need to be pushed. You move naturally.
            </p>
          </div>
          <div className="bg-[var(--pearl)] p-8 shadow-[0_14px_48px_rgba(43,27,53,0.07)] md:p-10">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">Daily use</p>
            <h3 className="font-display text-4xl font-light leading-tight">This becomes part of how you think.</h3>
            <div className="mt-8 grid gap-5 text-[15px] font-light leading-relaxed text-[var(--plum-soft)]">
              <p>Each day, you write what is real, the system reflects what you could not see, and you make one small shift.</p>
              <p>Over time, you stop repeating yourself. You stop avoiding decisions. You stop betraying what you know.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--pearl)] px-5 py-24 md:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">Different by design</p>
            <h2 className="font-display text-[clamp(38px,5vw,64px)] font-light leading-[1.08]">
              Not another place to talk in circles.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--plum-soft)]">This is not</p>
              <div className="space-y-3">
                {notThis.map((item) => (
                  <p key={item} className="text-[17px] font-light text-[var(--plum-soft)]">× {item}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clay)]">This is</p>
              <div className="space-y-3">
                {thisIs.map((item) => (
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
            Trusted by leaders, creators, and individuals ready to stop avoiding themselves.
          </p>
          <p className="mt-5 text-sm font-light text-[var(--plum-soft)]">Testimonials and authority proof can be added here.</p>
        </div>
      </section>

      <section className="bg-[var(--primary)] px-5 py-28 text-center text-[var(--cream)] md:px-8 lg:py-36">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-[clamp(46px,6vw,86px)] font-light leading-[1.02]">
            You do not need another system.
            <br />
            <span className="italic text-[var(--clay-light)]">You need to see.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-[17px] font-light leading-[1.8] text-[var(--cream)]/72">
            You already know more than you think. This is where you finally face it.
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
          <span className="font-display text-lg font-light tracking-wide text-[var(--cream)]/55">Supraconscious</span>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[13px] font-light text-[var(--cream)]/38">
            <span>Private by default</span>
            <span>Safety-aware reflection</span>
            <span>Source-grounded when eligible</span>
          </div>
          <span className="text-xs text-[var(--cream)]/25">© {new Date().getFullYear()} Supraconscious</span>
        </div>
      </footer>
    </main>
  )
}
