import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"

type PatternSummary = {
  id: string
  patternLabel: string
  evidenceCount: number
  confidence: number
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

export default async function PatternsPage() {
  const user = await requireAppUser()
  const patterns: PatternSummary[] = await prisma.patternMemory.findMany({
    where: { userId: user.id, active: true },
    orderBy: [{ evidenceCount: "desc" }, { lastSeenAt: "desc" }],
    select: { id: true, patternLabel: true, evidenceCount: true, confidence: true },
  })

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

      {/* ── Pattern grid ───────────────────────────────────────── */}
      {patterns.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {patterns.map((pattern) => (
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
                  {pattern.evidenceCount === 1 ? "time" : "times"} across your entries
                </p>
                <ConfidenceBar value={pattern.confidence} />
              </div>
            ))}
          </div>

          {/* Footnote */}
          <p
            className="text-[12px] font-light text-[var(--plum-soft)]/60 leading-relaxed max-w-lg px-1"
          >
            Patterns are reflective signals from your language — they invite exploration, not conclusion. You can disable pattern memory in settings.
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
