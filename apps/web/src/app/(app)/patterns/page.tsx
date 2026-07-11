import { prisma } from "@inner-avatar/db"
import { formatWebShortMonthDay } from "@/lib/date-format"
import { requireJournalAccessPageUser } from "@/lib/journal-access"
import { resolveWebLanguage } from "@/lib/language"
import { getWebMessages } from "@/lib/web-messages"
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

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 75 ? "var(--clay)" : pct >= 50 ? "var(--moonblue)" : "var(--plum-soft)"
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--plum-soft)]">
          {label}
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

export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ feedback?: string }>
}) {
  const user = await requireJournalAccessPageUser("/patterns")
  const messages = getWebMessages(await resolveWebLanguage(user.preferredLanguage))
  const patternMessages = messages.patterns
  const params = await searchParams
  const feedbackMessages = patternMessages.feedback as Record<string, string>
  const feedbackMessage = params.feedback ? feedbackMessages[params.feedback] : null
  const patterns: PatternSummary[] = await prisma.patternMemory.findMany({
    where: { userId: user.id },
    orderBy: [{ evidenceCount: "desc" }, { lastSeenAt: "desc" }],
    select: { id: true, patternLabel: true, evidenceCount: true, confidence: true, examples: true, lastSeenAt: true, active: true },
  })
  const activePatterns = patterns.filter((pattern) => pattern.active)
  const hiddenPatterns = patterns.filter((pattern) => !pattern.active)
  const readSeenSummary = (pattern: PatternSummary) =>
    `${patternMessages.seenPrefix} ${pattern.evidenceCount} ${
      pattern.evidenceCount === 1 ? patternMessages.seenTimeOne : patternMessages.seenTimeOther
    } ${patternMessages.seenAcross} · ${patternMessages.lastSeen} ${formatWebShortMonthDay(pattern.lastSeenAt)}`

  return (
    <div className="space-y-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1.5">
          {patternMessages.eyebrow}
        </p>
        <h1 className="font-display text-[40px] font-light text-[var(--primary)] leading-tight">
          {patternMessages.title}
        </h1>
        <p className="mt-3 text-[14px] font-light leading-relaxed text-[var(--plum-soft)] max-w-xl">
          {patternMessages.body}
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
                  {readSeenSummary(pattern)}
                </p>
                {Array.isArray(pattern.examples) && pattern.examples.length > 0 && (
                  <div
                    className="mt-4 rounded-xl px-4 py-3"
                    style={{ background: "rgba(43,27,53,0.035)" }}
                  >
                    <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-[var(--clay)] mb-2">
                      {patternMessages.whyAppeared}
                    </p>
                    <p className="text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
                      {String(pattern.examples[0]).slice(0, 180)}
                      {String(pattern.examples[0]).length > 180 ? "..." : ""}
                    </p>
                  </div>
                )}
                <ConfidenceBar value={pattern.confidence} label={patternMessages.confidence} />
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    ["helpful", patternMessages.actions.helpful],
                    ["not_accurate", patternMessages.actions.notAccurate],
                    ["too_intense", patternMessages.actions.tooIntense],
                    ["suppress", patternMessages.actions.hide],
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
                {patternMessages.hiddenSignals}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {hiddenPatterns.map((pattern) => (
                  <div key={pattern.id} className="rounded-2xl border p-4" style={{ background: "var(--pearl)", borderColor: "rgba(43,27,53,0.07)" }}>
                    <p className="font-display text-[17px] font-medium text-[var(--primary)]">
                      {pattern.patternLabel}
                    </p>
                    <p className="mt-1 text-[12px] font-light text-[var(--plum-soft)]">
                      {patternMessages.hiddenDescription}
                    </p>
                    <form action={submitPatternFeedbackAction} className="mt-3">
                      <input type="hidden" name="patternMemoryId" value={pattern.id} />
                      <input type="hidden" name="feedbackType" value="restore" />
                      <button type="submit" className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)]">
                        {patternMessages.actions.restore}
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
            {patternMessages.footnote}
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
            {patternMessages.emptyTitle}
          </h2>
          <p className="text-[14px] font-light text-[var(--plum-soft)] max-w-sm mx-auto leading-relaxed">
            {patternMessages.emptyBody}
          </p>
        </div>
      )}
    </div>
  )
}
