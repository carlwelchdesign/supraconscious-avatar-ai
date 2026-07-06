import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { HeroVisual } from "@/components/landing/hero-visual"

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <main className="min-h-screen bg-[var(--cream)] overflow-x-hidden">

      {/* ── Nav ────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{
          background: "rgba(244,237,228,0.88)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(43,27,53,0.07)",
        }}
      >
        <span className="font-display text-xl font-medium tracking-wide text-[var(--primary)]">
          Supraconscious
        </span>
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#how"
            className="text-sm text-[var(--plum-soft)] hover:text-[var(--primary)] transition-colors"
          >
            How it works
          </Link>
          <Link
            href="#reflect"
            className="text-sm text-[var(--plum-soft)] hover:text-[var(--primary)] transition-colors"
          >
            Reflect
          </Link>
        </nav>
        {user ? (
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-px"
          >
            Open journal
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-px"
          >
            Begin
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="min-h-screen grid lg:grid-cols-[1fr_1fr] items-center px-8 lg:px-20 pt-28 pb-16 lg:pt-0 gap-12">

        <div>
          <div className="hero-item-1 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--clay)] mb-8 px-4 py-2 rounded-full border border-[var(--clay)]/25 bg-[var(--clay)]/8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--clay)] animate-dot-pulse" />
            Maria-inspired Inner Council
          </div>

          <h1 className="hero-item-2 font-display text-[clamp(52px,6vw,84px)] font-light leading-[1.08] tracking-[-0.02em] text-[var(--primary)] mb-7">
            Enter.
            <br />
            <em className="italic font-normal text-[var(--clay)]">Listen inward.</em>
            <br />
            Cross the gate.
          </h1>

          <p className="hero-item-3 text-[17px] font-light leading-[1.75] text-[var(--plum-soft)] max-w-[480px] mb-12">
            A guided spiritual reflection journal inspired by Maria Olon Tsaroucha&apos;s supraconscious teachings. Write what is present, hear four inner archetypal lenses, then answer one clarifying question before one embodied micro-shift.
          </p>

          <div className="hero-item-4 flex flex-wrap items-center gap-4">
            {user ? (
              <Link
                href="/journal"
                className="inline-flex items-center gap-2.5 bg-[var(--primary)] text-[var(--cream)] text-[15px] font-medium px-7 py-4 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(43,27,53,0.25)]"
              >
                Continue your reflection
                <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2.5 bg-[var(--primary)] text-[var(--cream)] text-[15px] font-medium px-7 py-4 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(43,27,53,0.25)]"
                >
                  Cross the Gate
                  <ArrowRight className="w-[18px] h-[18px]" />
                </Link>
                <Link
                  href="#how"
                  className="text-[15px] font-light text-[var(--plum-soft)] hover:text-[var(--primary)] transition-colors py-4"
                >
                  See how it works ↓
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hero-visual">
          <HeroVisual />
        </div>
      </section>

      {/* ── Three pillars ─────────────────────────────────────── */}
      <section
        id="how"
        className="border-t px-8 lg:px-20 py-24"
        style={{ borderColor: "rgba(43,27,53,0.08)" }}
      >
        <div className="max-w-5xl mx-auto">
          <span className="block text-[11px] font-medium tracking-[0.16em] uppercase text-[var(--clay)] mb-4">
            The practice
          </span>
          <h2 className="font-display text-[clamp(36px,4vw,54px)] font-light text-[var(--primary)] mb-20 max-w-xl leading-[1.2]">
            A bounded council for inner{" "}
            <em className="italic font-normal">clarity</em>
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                num: "01",
                title: "Threshold",
                body: "Write plainly from the threshold. What is present today — emotions, observations, tensions. No performance required.",
              },
              {
                num: "02",
                title: "Council",
                body: "Protector, Conditioned Self, Visionary, and Truth Self reflect through distinct inner lenses so the entry becomes easier to observe.",
              },
              {
                num: "03",
                title: "Embodiment Gate",
                body: "The guide synthesizes one clarifying question, then you choose one grounded micro-shift that keeps your agency intact.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="group">
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-6 text-[11px] font-semibold tracking-widest text-[var(--clay)] border border-[var(--clay)]/20"
                  style={{ background: "rgba(184,137,90,0.07)" }}
                >
                  {num}
                </div>
                <h3 className="font-display text-2xl font-medium text-[var(--primary)] mb-3">
                  {title}
                </h3>
                <p className="text-[15px] font-light leading-relaxed text-[var(--plum-soft)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Journal feature highlight ─────────────────────────── */}
      <section
        id="reflect"
        className="px-8 lg:px-20 py-24"
        style={{ background: "rgba(250,247,243,0.6)" }}
      >
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
          <div>
            <span className="block text-[11px] font-medium tracking-[0.16em] uppercase text-[var(--clay)] mb-4">
              Inner Council
            </span>
            <h2 className="font-display text-[clamp(32px,3.5vw,48px)] font-light text-[var(--primary)] mb-6 leading-[1.25]">
              Source-aware reflection,{" "}
              <em className="italic font-normal">kept in your hands</em>
            </h2>
            <p className="text-[16px] font-light leading-[1.75] text-[var(--plum-soft)] mb-8">
              The experience can draw from approved source material and Maria-inspired principles when eligible, then clearly shows whether source context was used or the reflection came only from your entry.
            </p>
            <div className="space-y-3">
              {[
                "Uses approved source material only when it is eligible",
                "Shows when no approved source was used",
                "Keeps the Integrator to one clarifying question",
                "Safety-aware entries receive grounded support instead of confrontation",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "var(--clay)" }}
                  />
                  <p className="text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mock journal preview */}
          <div
            className="rounded-3xl border p-8 space-y-5"
            style={{
              background: "var(--pearl)",
              boxShadow: "0 8px 48px rgba(43,27,53,0.08)",
              borderColor: "rgba(43,27,53,0.07)",
            }}
          >
            <div className="space-y-1">
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)]">
                Monday, April 28
              </p>
              <p className="font-display text-[22px] font-light text-[var(--primary)]">
                What I keep coming back to
              </p>
            </div>
            <p
              className="font-display text-base font-light leading-[1.9] text-[var(--plum-soft)] journal-lines pb-2"
              style={{ minHeight: "96px" }}
            >
              I noticed today that I soften when I stop performing. There&apos;s something underneath the effort that feels more like me…
            </p>
            <div
              className="rounded-2xl p-5 border"
              style={{
                background: "rgba(184,137,90,0.05)",
                borderColor: "rgba(184,137,90,0.15)",
              }}
            >
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)] mb-2">
                Council reflection
              </p>
              <p className="font-display italic text-[15px] font-light text-[var(--plum-soft)] leading-[1.7]">
                &ldquo;The council is noticing a tension between the part that performs and the part that wants to soften. What becomes available when you stop proving for one breath?&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section
        className="px-8 lg:px-20 py-32 text-center relative overflow-hidden"
        style={{
          background: "var(--primary)",
        }}
      >
        {/* ambient glow */}
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{
            width: 600,
            height: 600,
            background: "radial-gradient(circle, var(--clay), transparent)",
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="font-display text-[clamp(44px,5.5vw,72px)] font-light text-[var(--cream)] leading-[1.12] mb-6">
            The quietest voice in the room
            <br />
            <em className="italic font-normal text-[var(--clay-light)]">
              is often the truest.
            </em>
          </h2>
          <p className="text-[16px] font-light text-[var(--cream)]/65 leading-[1.75] mb-10 max-w-md mx-auto">
            Begin with a short consent step, then write one honest entry and let the council reflect it back.
          </p>
          <Link
            href={user ? "/journal" : "/register"}
            className="inline-flex items-center gap-2.5 bg-[var(--clay)] text-[var(--cream)] text-[15px] font-medium px-8 py-4 rounded-full hover:bg-[var(--clay-light)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(184,137,90,0.35)]"
          >
            {user ? "Continue your reflection" : "Begin your reflection"}
            <ArrowRight className="w-[18px] h-[18px]" />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer
        className="px-8 lg:px-20 py-10 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{
          background: "var(--primary)",
          borderTop: "1px solid rgba(244,237,228,0.08)",
        }}
      >
        <span className="font-display text-lg font-light text-[var(--cream)]/50 tracking-wide">
          Supraconscious
        </span>
        <div className="flex items-center gap-8">
          <span className="text-[13px] font-light text-[var(--cream)]/35">
            Private by default
          </span>
          <span className="text-[13px] font-light text-[var(--cream)]/35">
            Safety-aware reflection
          </span>
        </div>
        <span className="text-[12px] text-[var(--cream)]/25">
          © {new Date().getFullYear()} Supraconscious
        </span>
      </footer>
    </main>
  )
}
