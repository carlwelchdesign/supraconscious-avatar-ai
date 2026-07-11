import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import { getGuideStageConfigs, readGuideStageConfig, runFounderCalibrationJournalReadiness } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { AvatarOrb } from "@inner-avatar/ui/avatar-orb"
import { formatWebDayOfMonth, formatWebMonthDay, formatWebShortMonth, getAppHour } from "@/lib/date-format"
import { requireJournalAccessPageUser } from "@/lib/journal-access"
import { resolveWebLanguage } from "@/lib/language"
import { getWebMessages } from "@/lib/web-messages"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ feedback?: string; delete?: string }>
}) {
  const user = await requireJournalAccessPageUser("/dashboard")
  const query = await searchParams

  const [entryCount, patternCount, recentEntries, founderReadiness, guideStages] = await Promise.all([
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
    runFounderCalibrationJournalReadiness({
      userId: user.id,
      email: user.email,
    }),
    getGuideStageConfigs(prisma),
  ])

  const latestEntry = recentEntries[0] ?? null
  const founderCalibrationMode = founderReadiness.founderCalibrationMode
  const founderSessionCount = founderReadiness.sessionCount
  const founderFeedbackEvidenceCount = founderReadiness.feedbackEvidenceCount
  const founderGoldenExampleCount = founderReadiness.goldenExampleCount
  const founderNeedsSession = founderSessionCount === 0
  const founderNeedsFirstSession = founderCalibrationMode && founderNeedsSession
  const founderNeedsFeedback = founderCalibrationMode && founderSessionCount > 0 && founderFeedbackEvidenceCount === 0
  const founderCanContinueCalibration = founderCalibrationMode && founderFeedbackEvidenceCount > 0 && founderGoldenExampleCount === 0
  const founderFeedbackHref = founderReadiness.founderFeedbackHref ?? (latestEntry ? `/journal/${latestEntry.id}` : "/journal")
  const guideStage = Math.min(Math.max(user.avatarStage ?? 1, 1), 5)
  const guideStageName = readGuideStageConfig(guideStages, guideStage).name
  const currentLanguage = await resolveWebLanguage(user.preferredLanguage)
  const messages = getWebMessages(currentLanguage)
  const dashboard = messages.dashboard
  const dashboardMessage = readDashboardMessage(query, dashboard)
  const levelName = dashboard.levelNames[(user.currentLevel ?? 1) - 1] ?? dashboard.levelNames[0]

  const greeting = (() => {
    const h = getAppHour()
    if (h < 12) return dashboard.goodMorning
    if (h < 17) return dashboard.goodAfternoon
    return dashboard.goodEvening
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
            {user.name ?? dashboard.welcomeBack}
          </h1>
          <p className="mt-2 text-[14px] font-light text-[var(--plum-soft)]">
            {formatDashboardMessage(dashboard.currentLevel, { level: levelName })}
          </p>
        </div>
        <Link
          href="/journal"
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-[14px] font-medium px-5 py-3 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-px whitespace-nowrap self-start sm:self-auto"
        >
          {dashboard.newEntry}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {dashboardMessage && (
        <div
          className="rounded-2xl border px-5 py-4"
          style={{
            background: dashboardMessage.tone === "error" ? "rgba(147,62,62,0.08)" : "rgba(184,137,90,0.08)",
            borderColor: dashboardMessage.tone === "error" ? "rgba(147,62,62,0.18)" : "rgba(184,137,90,0.18)",
          }}
        >
          <p className="text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
            {dashboardMessage.text}
          </p>
        </div>
      )}

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
            {dashboard.founderNextStep}
          </p>
          <h2 className="mt-2 font-display text-[24px] font-light text-[var(--primary)]">
            {dashboard.runGuidedCalibrationTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
            {dashboard.runGuidedCalibrationBody}
          </p>
          <Link
            href="/journal"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] transition-all hover:-translate-y-px hover:bg-[var(--plum-mid)]"
          >
            {dashboard.openGuidedJournal}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {founderNeedsFeedback && latestEntry && (
        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--pearl)",
            borderColor: "rgba(184,137,90,0.18)",
            boxShadow: "0 4px 24px rgba(184,137,90,0.06)",
          }}
        >
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)]">
            {dashboard.founderNextStep}
          </p>
          <h2 className="mt-2 font-display text-[24px] font-light text-[var(--primary)]">
            {dashboard.chooseFeedbackTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
            {dashboard.chooseFeedbackBody}
          </p>
          <Link
            href={founderFeedbackHref}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] transition-all hover:-translate-y-px hover:bg-[var(--plum-mid)]"
          >
            {dashboard.addFeedback}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {founderCanContinueCalibration && (
        <div
          className="rounded-2xl border p-5"
          style={{
            background: "rgba(184,137,90,0.07)",
            borderColor: "rgba(184,137,90,0.16)",
          }}
        >
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)]">
            {dashboard.founderCalibration}
          </p>
          <p className="mt-2 text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
            {dashboard.feedbackSavedContinueBody}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-[12px] font-medium text-[var(--cream)] transition-all hover:-translate-y-px hover:bg-[var(--plum-mid)]"
            >
              {dashboard.continueCalibration}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={founderFeedbackHref}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium text-[var(--primary)] transition-all hover:-translate-y-px"
              style={{ borderColor: "rgba(43,27,53,0.08)" }}
            >
              {dashboard.openLatestSession}
            </Link>
          </div>
        </div>
      )}

      {/* ── Guide hero ───────────────────────────────────────── */}
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
            {formatDashboardMessage(dashboard.guideHeroEyebrow, { stage: guideStage })}
          </p>
          <h2 className="font-display text-[28px] font-light text-[var(--cream)] mb-3 leading-tight">
            {guideStageName}
          </h2>
          <p className="text-[14px] font-light leading-[1.7] text-[var(--cream)]/60 max-w-sm">
            {dashboard.guideHeroBody}
          </p>
          <Link
            href="/guide"
            className="inline-flex items-center gap-1.5 mt-4 text-[13px] font-medium text-[var(--clay-light)] hover:text-[var(--cream)] transition-colors"
          >
            {dashboard.seeGuideEvolution}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: dashboard.entriesWritten, value: entryCount, unit: entryCount === 1 ? dashboard.entryUnit : dashboard.entriesUnit },
          { label: dashboard.activePatterns, value: patternCount, unit: dashboard.patternsUnit },
          { label: dashboard.guideStage, value: guideStage, unit: dashboard.ofFive },
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
            {dashboard.mostRecentReflection}
          </p>
          <p className="font-display italic text-[18px] font-light text-[var(--plum-soft)] leading-[1.8]">
            &ldquo;{latestEntry.avatarResponse.mirror ?? dashboard.guideListeningFallback}&rdquo;
          </p>
          <Link
            href={`/journal/${latestEntry.id}`}
            className="inline-flex items-center gap-1.5 mt-5 text-[13px] font-medium text-[var(--clay)] hover:text-[var(--primary)] transition-colors"
          >
            {dashboard.openThisSession}
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
            {dashboard.firstCouncilWaiting}
          </p>
          <p className="text-[14px] font-light text-[var(--plum-soft)]/70 max-w-sm mx-auto mb-6">
            {dashboard.firstCouncilBody}
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-[14px] font-medium px-6 py-3 rounded-full hover:bg-[var(--plum-mid)] transition-all"
          >
            {dashboard.beginWriting}
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
                {dashboard.pastReflections}
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {recentEntries.map((entry) => {
              const label = formatWebMonthDay(entry.createdAt, currentLanguage)
              const excerpt = entry.rawText.length > 140
                ? entry.rawText.slice(0, 140).trimEnd() + "…"
                : entry.rawText
              const reflection = entry.avatarResponse?.mirror
              const pattern = entry.avatarResponse?.patternName
              const safety = entry.councilSession?.safetySnapshot as { severity?: string } | undefined
              const feedbackTypes = entry.councilSession?.feedback.map((item) => item.feedbackType) ?? []
              const hasFeedback = Boolean(entry.councilSession?.feedback.length)
              const hasFeedbackNote = Boolean(entry.councilSession?.feedback.some((item) => item.note?.trim()))
              const founderFeedbackSummary = founderCalibrationMode
                ? readFounderFeedbackSummary({ hasFeedback, hasFeedbackNote }, dashboard)
                : null
              const review = entry.councilSession?.qualityReviews[0]
              const founderReviewSummary = founderCalibrationMode
                ? readFounderReviewSummary({ reviewLabel: review?.label, reviewSeverity: review?.severity }, dashboard)
                : null
              const reviewMetadata = review?.metadata as { feedbackDisposition?: string } | null | undefined
              const reportedForReview = feedbackTypes.some((type) => ["not_accurate", "too_intense", "unclear", "unsupported_source"].includes(type))
              const statuses = [
                entry.councilSession?.embodimentGateResponses.length ? dashboard.gateSaved : entry.councilSession ? dashboard.gateOpen : null,
                hasFeedback ? dashboard.feedbackSubmitted : entry.councilSession ? dashboard.feedbackNeeded : null,
                founderCalibrationMode && hasFeedbackNote ? dashboard.noteAdded : null,
                reportedForReview && !reviewMetadata?.feedbackDisposition ? dashboard.needsFollowUp : null,
                review?.severity === "pilot_blocker" ? dashboard.needsAttention : null,
                reviewMetadata?.feedbackDisposition === "cleared" ? dashboard.resolved : null,
                reviewMetadata?.feedbackDisposition === "blocked" ? dashboard.needsAttention : null,
                entry.councilSession?.sourceMode === "rag" ? dashboard.sourceGrounded : null,
                safety?.severity && safety.severity !== "none" ? dashboard.safetyGrounded : null,
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
                      {formatWebDayOfMonth(entry.createdAt)}
                    </p>
                    <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-[var(--plum-soft)] mt-0.5">
                      {formatWebShortMonth(entry.createdAt, currentLanguage)}
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
                        {founderFeedbackSummary ? (
                          <p className="text-[11px] font-light text-[var(--plum-soft)]/60">
                            {founderFeedbackSummary}
                          </p>
                        ) : null}
                        {founderReviewSummary ? (
                          <p className="text-[11px] font-light text-[var(--plum-soft)]/60">
                            {founderReviewSummary}
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

type DashboardCopy = {
  [key: string]: string | readonly string[]
}

function formatDashboardMessage(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

function readFounderFeedbackSummary(
  input: { hasFeedback: boolean; hasFeedbackNote: boolean },
  dashboard: DashboardCopy,
) {
  if (!input.hasFeedback) return null
  return input.hasFeedbackNote
    ? String(dashboard.feedbackNoteSaved)
    : String(dashboard.feedbackTypeSaved)
}

function readFounderReviewSummary(
  input: { reviewLabel?: string | null; reviewSeverity?: string | null },
  dashboard: DashboardCopy,
) {
  if (!input.reviewLabel) return null

  if (input.reviewSeverity === "pilot_blocker") return String(dashboard.reviewPilotBlocker)
  if (input.reviewLabel === "ready") return String(dashboard.reviewReady)
  if (input.reviewLabel === "voice_good" || input.reviewLabel === "source_good") return String(dashboard.reviewStrongEvidence)
  if (input.reviewLabel === "voice_wrong") return String(dashboard.reviewVoiceWrong)
  if (input.reviewLabel === "source_unsupported") return String(dashboard.reviewSourceUnsupported)
  if (input.reviewLabel === "embodiment_weak") return String(dashboard.reviewEmbodimentWeak)
  if (input.reviewLabel === "too_generic") return String(dashboard.reviewTooGeneric)
  if (input.reviewLabel === "too_intense") return String(dashboard.reviewTooIntense)
  if (input.reviewLabel === "prompt_regression") return String(dashboard.reviewPromptRegression)

  return formatDashboardMessage(String(dashboard.reviewFallback), { label: input.reviewLabel.replaceAll("_", " ") })
}

function readDashboardMessage(query: { feedback?: string; delete?: string }, dashboard: DashboardCopy) {
  if (query.feedback === "invalid") {
    return { tone: "error", text: String(dashboard.feedbackInvalid) } as const
  }
  if (query.feedback === "session_missing") {
    return { tone: "error", text: String(dashboard.feedbackSessionMissing) } as const
  }
  if (query.delete === "invalid") {
    return { tone: "error", text: String(dashboard.deleteInvalid) } as const
  }
  if (query.delete === "missing") {
    return { tone: "error", text: String(dashboard.deleteMissing) } as const
  }
  return null
}
