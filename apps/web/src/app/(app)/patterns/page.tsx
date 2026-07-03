import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { submitPatternFeedbackAction } from "./actions"

type PatternSummary = {
  id: string
  patternLabel: string
  evidenceCount: number
  confidence: number
  examples: unknown
  lastSeenAt: Date
  active: boolean
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 75 ? "var(--clay)" : pct >= 50 ? "var(--moonblue)" : "var(--plum-soft)"
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--plum-soft)]">
          Confidence
        </span>
        <span className="text-[12px] font-light text-[var(--plum-soft)]">{pct}%</span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(43,27,53,0.08)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

const FEEDBACK_MESSAGES: Record<string, string> = {
  helpful: "Marked helpful. Future pattern review can treat this signal as more useful.",
  not_accurate: "Marked not accurate. This correction was saved for pattern review.",
  too_intense: "Marked too intense. This signal was flagged for a gentler review.",
  suppress: "Hidden from active pattern memory.",
  restore: "Restored to active pattern memory.",
}

export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ feedback?: string }>
}) {
  const user = await requireAppUser()
  const params = await searchParams
  const feedbackMessage = params.feedback ? FEEDBACK_MESSAGES[params.feedback] : null
  const patterns: PatternSummary[] = await prisma.patternMemory.findMany({
    where: { userId: user.id },
    orderBy: [{ evidenceCount: "desc" }, { lastSeenAt: "desc" }],
    select: { id: true, patternLabel: true, evidenceCount: true, confidence: true, examples: true, lastSeenAt: true, active: true },
  })
  const activePatterns = patterns.filter((pattern) => pattern.active)
  const hiddenPatterns = patterns.filter((pattern) => !pattern.active)

  return (
    <div className="space-y-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1.5">
          Pattern awareness
        </p>
        <h1 className="font-display text-[40px] font-light text-[var(--primary)] leading-tight">
          Signals, not diagnoses
        </h1>
        <p className="mt-3 text-[14px] font-light leading-relaxed text-[var(--plum-soft)] max-w-xl">
          Patterns appear only after they recur across multiple entries. Nothing is labeled from a single moment.
        </p>
      </div>

      {feedbackMessage && (
        <div
          className="rounded-2xl border px-5 py-4 text-[13px] font-light text-[var(--plum-soft)]"
          style={{
            background: "var(--pearl)",
            borderColor: "rgba(184,137,90,0.18)",
          }}
        >
          {feedbackMessage}
        </div>
      )}

      {/* ── Pattern grid ───────────────────────────────────────── */}
      {patterns.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {activePatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="rounded-2xl border p-6 transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--pearl)",
                  borderColor: "rgba(43,27,53,0.07)",
                  boxShadow: "0 2px 16px rgba(43,27,53,0.04)",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display text-[20px] font-medium text-[var(--primary)] leading-snug">
                    {pattern.patternLabel}
                  </h3>
                  <span
                    className="text-[11px] font-medium tracking-[0.08em] uppercase px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      background: "rgba(43,27,53,0.05)",
                      color: "var(--plum-soft)",
                    }}
                  >
                    {pattern.evidenceCount}×
                  </span>
                </div>
                <p className="text-[13px] font-light text-[var(--plum-soft)]/70">
                  Seen {pattern.evidenceCount}{" "}
                  {pattern.evidenceCount === 1 ? "time" : "times"} across your entries · last seen{" "}
                  {pattern.lastSeenAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                {Array.isArray(pattern.examples) && pattern.examples.length > 0 && (
                  <div
                    className="mt-4 rounded-xl px-4 py-3"
                    style={{ background: "rgba(43,27,53,0.035)" }}
                  >
                    <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-[var(--clay)] mb-2">
                      Why this appeared
                    </p>
                    <p className="text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
                      {String(pattern.examples[0]).slice(0, 180)}
                      {String(pattern.examples[0]).length > 180 ? "..." : ""}
                    </p>
                  </div>
                )}
                <ConfidenceBar value={pattern.confidence} />
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    ["helpful", "Helpful"],
                    ["not_accurate", "Not accurate"],
                    ["too_intense", "Too intense"],
                    ["suppress", "Hide"],
                  ].map(([feedbackType, label]) => (
                    <form key={feedbackType} action={submitPatternFeedbackAction}>
                      <input type="hidden" name="patternMemoryId" value={pattern.id} />
                      <input type="hidden" name="feedbackType" value={feedbackType} />
                      <button
                        type="submit"
                        className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] transition hover:bg-[rgba(43,27,53,0.04)]"
                        style={{ borderColor: "rgba(43,27,53,0.08)" }}
                      >
                        {label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {hiddenPatterns.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-[22px] font-light text-[var(--primary)]">
                Hidden signals
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {hiddenPatterns.map((pattern) => (
                  <div key={pattern.id} className="rounded-2xl border p-4" style={{ background: "var(--pearl)", borderColor: "rgba(43,27,53,0.07)" }}>
                    <p className="font-display text-[17px] font-medium text-[var(--primary)]">
                      {pattern.patternLabel}
                    </p>
                    <p className="mt-1 text-[12px] font-light text-[var(--plum-soft)]">
                      Hidden from active pattern memory.
                    </p>
                    <form action={submitPatternFeedbackAction} className="mt-3">
                      <input type="hidden" name="patternMemoryId" value={pattern.id} />
                      <input type="hidden" name="feedbackType" value="restore" />
                      <button type="submit" className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)]">
                        Restore
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footnote */}
          <p
            className="text-[12px] font-light text-[var(--plum-soft)]/60 leading-relaxed max-w-lg px-1"
          >
            Patterns are draft reflective signals from your language. You can correct or hide any signal here, or disable pattern memory in settings.
          </p>
        </>
      ) : (
        /* Empty state */
        <div
          className="rounded-3xl border border-dashed p-14 text-center"
          style={{ borderColor: "rgba(43,27,53,0.12)" }}
        >
          <div
            className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(184,137,90,0.08)" }}
          >
            <span className="text-[24px]">◎</span>
          </div>
          <h2 className="font-display text-[24px] font-light text-[var(--primary)] mb-3">
            Patterns emerge over time
          </h2>
          <p className="text-[14px] font-light text-[var(--plum-soft)] max-w-sm mx-auto leading-relaxed">
            Keep writing. Your Avatar notices recurring language and emotional signals only after they appear across multiple entries.
          </p>
        </div>
      )}
    </div>
  )
}
