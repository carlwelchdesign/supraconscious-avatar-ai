import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import { isFounderCalibrationUser, runFounderCalibrationSetupReport } from "@inner-avatar/ai"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { AvatarOrb } from "@inner-avatar/ui/avatar-orb"

const AVATAR_STAGE_NAMES = ["Echo", "Witness", "Clear Mirror", "Reframer", "Inner Author"]
const LEVEL_NAMES = ["Awareness", "Pattern Recognition", "Honest Reflection", "Reframing", "Conscious Choice"]

export default async function DashboardPage() {
  const user = await requireAppUser()

  const founderCalibrationMode = await isFounderCalibrationUser(user.email)
  const [entryCount, patternCount, recentEntries, setupReport] = await Promise.all([
    prisma.journalEntry.count({ where: { userId: user.id } }),
    prisma.patternMemory.count({ where: { userId: user.id, active: true } }),
    prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        avatarResponse: true,
        councilSession: {
          select: {
            sourceMode: true,
            safetySnapshot: true,
            feedback: { select: { id: true, feedbackType: true, note: true } },
            embodimentGateResponses: { select: { id: true } },
            qualityReviews: {
              orderBy: { reviewedAt: "desc" },
              take: 1,
              select: { label: true, severity: true, metadata: true },
            },
          },
        },
      },
    }),
    founderCalibrationMode ? runFounderCalibrationSetupReport() : Promise.resolve(null),
  ])

  const latestEntry = recentEntries[0] ?? null
  const founderParticipant = setupReport?.participants.find((participant) => participant.userId === user.id || participant.email === user.email.toLowerCase())
  const founderSessionCount = founderParticipant?.sessionCount ?? 0
  const founderFeedbackNoteCount = founderParticipant?.feedbackNoteCount ?? 0
  const founderGoldenExampleCount = founderParticipant?.goldenExampleCount ?? 0
  const founderNeedsSession = founderSessionCount === 0
  const founderNeedsFirstSession = founderCalibrationMode && Boolean(founderParticipant) && founderNeedsSession
  const founderNeedsFeedbackNote = founderCalibrationMode && Boolean(founderParticipant) && founderSessionCount > 0 && founderFeedbackNoteCount === 0
  const founderAwaitingReview = founderCalibrationMode && Boolean(founderParticipant) && founderFeedbackNoteCount > 0 && founderGoldenExampleCount === 0
  const founderFeedbackNoteHref = founderParticipant?.latestSessionHref ?? (latestEntry ? `/journal/${latestEntry.id}` : "/journal")
  const guideStage = Math.min(Math.max(user.avatarStage ?? 1, 1), 5)
  const guideStageName = AVATAR_STAGE_NAMES[guideStage - 1] ?? AVATAR_STAGE_NAMES[0]

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  })()

  return (
    <div className="space-y-10">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1.5">
            {greeting}
          </p>
          <h1 className="font-display text-[40px] font-light leading-tight text-[var(--primary)]">
            {user.name ?? "Welcome back"}
          </h1>
          <p className="mt-2 text-[14px] font-light text-[var(--plum-soft)]">
            Your current level is{" "}
            <span className="font-medium text-[var(--primary)]">{LEVEL_NAMES[(user.currentLevel ?? 1) - 1]}</span>.
          </p>
        </div>
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-[14px] font-medium px-5 py-3 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-px whitespace-nowrap self-start sm:self-auto"
        >
          New entry
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {founderNeedsFirstSession && (
        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--pearl)",
            borderColor: "rgba(184,137,90,0.18)",
            boxShadow: "0 4px 24px rgba(184,137,90,0.06)",
          }}
        >
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)]">
            Founder calibration next step
          </p>
          <h2 className="mt-2 font-display text-[24px] font-light text-[var(--primary)]">
            Run one guided calibration session.
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
            Use the suggested guided scenario, submit one reflection, choose a feedback type, and leave one short note about what felt right or what should change.
          </p>
          <Link
            href="/journal"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] transition-all hover:-translate-y-px hover:bg-[var(--plum-mid)]"
          >
            Open guided journal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {founderNeedsFeedbackNote && latestEntry && (
        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--pearl)",
            borderColor: "rgba(184,137,90,0.18)",
            boxShadow: "0 4px 24px rgba(184,137,90,0.06)",
          }}
        >
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)]">
            Founder calibration next step
          </p>
          <h2 className="mt-2 font-display text-[24px] font-light text-[var(--primary)]">
            Add one note to your latest session.
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
            A reflection was saved, but Carl/Maria calibration still needs a short note about what felt right, wrong, unsupported, or unlike Maria&apos;s phrasing.
          </p>
          <Link
            href={founderFeedbackNoteHref}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] transition-all hover:-translate-y-px hover:bg-[var(--plum-mid)]"
          >
            Add feedback note
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {founderAwaitingReview && (
        <div
          className="rounded-2xl border p-5"
          style={{
            background: "rgba(184,137,90,0.07)",
            borderColor: "rgba(184,137,90,0.16)",
          }}
        >
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)]">
            Founder calibration
          </p>
          <p className="mt-2 text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
            Your feedback note is saved. Keep going with another guided scenario, or open the session if you want to add more detail about what felt right or what should change.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-[12px] font-medium text-[var(--cream)] transition-all hover:-translate-y-px hover:bg-[var(--plum-mid)]"
            >
              Continue calibration
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={founderFeedbackNoteHref}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium text-[var(--primary)] transition-all hover:-translate-y-px"
              style={{ borderColor: "rgba(43,27,53,0.08)" }}
            >
              Open latest session
            </Link>
          </div>
        </div>
      )}

      {/* ── Avatar hero ──────────────────────────────────────── */}
      <div
        className="rounded-3xl border p-8 flex items-center gap-8 overflow-hidden relative"
        style={{
          background: "var(--primary)",
          borderColor: "var(--primary)",
        }}
      >
        {/* ambient glow */}
        <span
          className="absolute top-1/2 right-16 -translate-y-1/2 w-64 h-64 rounded-full blur-[60px] opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--clay), transparent)" }}
        />

        <AvatarOrb size="lg" stage={guideStage as 1|2|3|4|5} className="flex-shrink-0 relative z-10" />

        <div className="relative z-10">
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay-light)] mb-2">
            Inner Council guide · Stage {guideStage}
          </p>
          <h2 className="font-display text-[28px] font-light text-[var(--cream)] mb-3 leading-tight">
            {guideStageName}
          </h2>
          <p className="text-[14px] font-light leading-[1.7] text-[var(--cream)]/60 max-w-sm">
            Reflecting your language back with care while the council practice deepens.
          </p>
          <Link
            href="/avatar"
            className="inline-flex items-center gap-1.5 mt-4 text-[13px] font-medium text-[var(--clay-light)] hover:text-[var(--cream)] transition-colors"
          >
            See the guide&apos;s evolution
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Entries written", value: entryCount, unit: entryCount === 1 ? "entry" : "entries" },
          { label: "Active patterns", value: patternCount, unit: "patterns" },
          { label: "Guide stage", value: guideStage, unit: "of 5" },
        ].map(({ label, value, unit }) => (
          <div
            key={label}
            className="rounded-2xl border p-6"
            style={{
              background: "var(--pearl)",
              borderColor: "rgba(43,27,53,0.07)",
            }}
          >
            <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--plum-soft)] mb-3">
              {label}
            </p>
            <div className="flex items-end gap-2">
              <span className="font-display text-[44px] font-light leading-none text-[var(--primary)]">
                {value}
              </span>
              <span className="text-[13px] font-light text-[var(--plum-soft)] mb-1">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Latest reflection ────────────────────────────────── */}
      {latestEntry?.avatarResponse && (
        <div
          className="rounded-2xl border p-7"
          style={{
            background: "var(--pearl)",
            borderColor: "rgba(43,27,53,0.07)",
          }}
        >
          <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--clay)] mb-4">
            Most recent reflection
          </p>
          <p className="font-display italic text-[18px] font-light text-[var(--plum-soft)] leading-[1.8]">
            &ldquo;{latestEntry.avatarResponse.mirror ?? "Your guide is listening."}&rdquo;
          </p>
          <Link
            href={`/journal/${latestEntry.id}`}
            className="inline-flex items-center gap-1.5 mt-5 text-[13px] font-medium text-[var(--clay)] hover:text-[var(--primary)] transition-colors"
          >
            Open this session
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {!latestEntry && (
        <div
          className="rounded-2xl border border-dashed p-10 text-center"
          style={{ borderColor: "rgba(43,27,53,0.12)" }}
        >
          <p className="font-display text-[20px] font-light text-[var(--plum-soft)] mb-4">
            Your first council entry is waiting.
          </p>
          <p className="text-[14px] font-light text-[var(--plum-soft)]/70 max-w-sm mx-auto mb-6">
            Write what is present today — no structure required. The council will reflect it back with care.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-[14px] font-medium px-6 py-3 rounded-full hover:bg-[var(--plum-mid)] transition-all"
          >
            Begin writing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── Past reflections ─────────────────────────────────── */}
      {recentEntries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[var(--clay)]" />
              <h2 className="text-[13px] font-medium tracking-[0.08em] uppercase text-[var(--clay)]">
                Past reflections
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {recentEntries.map((entry) => {
              const date = new Date(entry.createdAt)
              const label = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              const excerpt = entry.rawText.length > 140
                ? entry.rawText.slice(0, 140).trimEnd() + "…"
                : entry.rawText
              const reflection = entry.avatarResponse?.mirror
              const pattern = entry.avatarResponse?.patternName
              const safety = entry.councilSession?.safetySnapshot as { severity?: string } | undefined
              const feedbackTypes = entry.councilSession?.feedback.map((item) => item.feedbackType) ?? []
              const hasFeedbackNote = entry.councilSession?.feedback.some((item) => item.note?.trim()) ?? false
              const review = entry.councilSession?.qualityReviews[0]
              const reviewMetadata = review?.metadata as { feedbackDisposition?: string } | null | undefined
              const reportedForReview = feedbackTypes.some((type) => ["not_accurate", "too_intense", "unclear", "unsupported_source"].includes(type))
              const statuses = [
                entry.councilSession?.embodimentGateResponses.length ? "Gate saved" : entry.councilSession ? "Gate open" : null,
                entry.councilSession?.feedback.length ? "Feedback submitted" : entry.councilSession ? "Feedback needed" : null,
                founderCalibrationMode && entry.councilSession && !hasFeedbackNote ? "Feedback note needed" : null,
                reportedForReview && !reviewMetadata?.feedbackDisposition ? "Under review" : null,
                review?.severity === "pilot_blocker" ? (founderCalibrationMode ? "Calibration blocker" : "Review blocked") : null,
                reviewMetadata?.feedbackDisposition === "cleared" ? "Review cleared" : null,
                reviewMetadata?.feedbackDisposition === "blocked" ? "Review blocked" : null,
                entry.councilSession?.sourceMode === "rag" ? "Source-grounded" : null,
                safety?.severity && safety.severity !== "none" ? "Safety-grounded" : null,
              ].filter(Boolean)

              return (
                <Link
                  key={entry.id}
                  href={`/journal/${entry.id}`}
                  className="group flex items-start gap-5 rounded-2xl border p-5 transition-all hover:-translate-y-px hover:shadow-sm"
                  style={{
                    background: "var(--pearl)",
                    borderColor: "rgba(43,27,53,0.07)",
                  }}
                >
                  {/* Date column */}
                  <div className="flex-shrink-0 w-14 pt-0.5 text-center">
                    <p className="font-display text-[28px] font-light leading-none text-[var(--clay)]">
                      {date.getDate()}
                    </p>
                    <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-[var(--plum-soft)] mt-0.5">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                  </div>

                  {/* Divider */}
                  <span
                    className="flex-shrink-0 w-px self-stretch opacity-20"
                    style={{ background: "var(--primary)" }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--plum-soft)]">
                        {label}
                      </p>
                      {pattern && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(184,137,90,0.10)",
                            color: "var(--clay)",
                          }}
                        >
                          {pattern}
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-light leading-[1.65] text-[var(--primary)] line-clamp-2">
                      {excerpt}
                    </p>
                    {reflection && (
                      <p className="font-display italic text-[13px] font-light text-[var(--plum-soft)] mt-2 line-clamp-1">
                        &ldquo;{reflection}&rdquo;
                      </p>
                    )}
                    {statuses.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] font-light text-[var(--plum-soft)]/70">
                          {statuses.join(" · ")}
                        </p>
                        {founderCalibrationMode && entry.councilSession?.feedback.length ? (
                          <p className="text-[11px] font-light text-[var(--plum-soft)]/60">
                            Calibration note: feedback helps reviewers improve guidance; it does not automatically retrain the guide.
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="flex-shrink-0 w-4 h-4 text-[var(--plum-soft)] opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
