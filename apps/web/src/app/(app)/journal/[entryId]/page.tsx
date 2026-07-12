import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { buildSourceProvenanceMessage, getGuideStageConfigs, isFounderCalibrationUser, readGuideStageConfig } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { AvatarOrb } from "@inner-avatar/ui/avatar-orb"
import { AudioPlayer } from "@/components/voice/AudioPlayer"
import { formatWebLongDate } from "@/lib/date-format"
import { readFounderReviewSummary } from "@/lib/founder-review-summary"
import { requireJournalAccessPageUser } from "@/lib/journal-access"
import { resolveWebLanguage } from "@/lib/language"
import { readSavedSessionCalibrationGuidance } from "@/lib/saved-session-calibration"
import { buildSpeakText } from "@/lib/voice/voice-config"
import { getWebMessages } from "@/lib/web-messages"
import { deleteJournalEntryAction, submitSavedSessionFeedbackAction } from "./actions"
import { DeleteJournalEntryForm } from "./delete-journal-entry-form"
import { SavedSessionFeedbackForm } from "./saved-session-feedback-form"

export default async function JournalEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ entryId: string }>
  searchParams: Promise<{ feedback?: string }>
}) {
  const [resolvedParams, query] = await Promise.all([params, searchParams])
  const entryNextPath = `/journal/${resolvedParams.entryId}${query.feedback ? `?feedback=${encodeURIComponent(query.feedback)}` : ""}`
  const user = await requireJournalAccessPageUser(entryNextPath)
  const currentLanguage = await resolveWebLanguage(user.preferredLanguage)
  const messages = getWebMessages(currentLanguage)
  const journalMessages = messages.journal
  const sessionMessages = messages.sessionDetail
  const feedbackTypeLabels = sessionMessages.feedbackTypes as Record<string, string>
  const [founderCalibrationMode, entry, guideStages] = await Promise.all([
    isFounderCalibrationUser(user.email),
    prisma.journalEntry.findFirst({
      where: { id: resolvedParams.entryId, userId: user.id },
      include: {
        avatarResponse: {
          select: {
            openingLine: true,
            mirror: true,
            patternName: true,
            contradiction: true,
            socraticQuestion: true,
            integrationStep: true,
            closingLine: true,
          },
        },
      councilSession: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              displayName: true,
              abstained: true,
              content: true,
            },
          },
          synthesis: true,
          feedback: {
            select: {
              id: true,
              feedbackType: true,
              note: true,
            },
          },
          embodimentGateResponses: { select: { id: true } },
          qualityReviews: {
            orderBy: { reviewedAt: "desc" },
            take: 1,
            select: { label: true, severity: true, metadata: true, reviewedAt: true },
          },
          generationTraces: {
            where: { traceType: "retrieval" },
            orderBy: { createdAt: "asc" },
            include: {
              sourceChunk: {
                select: {
                  id: true,
                  sourceDocument: { select: { title: true } },
                },
              },
            },
          },
        },
      },
      },
    }),
    getGuideStageConfigs(prisma, currentLanguage),
  ])

  if (!entry) notFound()

  const dateLabel = formatWebLongDate(entry.createdAt)
  const r = entry.avatarResponse
  const speakText = r ? buildSpeakText(r) : ""
  const voicePrefs = {
    gender: user.voiceGender ?? "female",
    style: user.voiceStyle ?? "warm",
    speed: user.voiceSpeed ?? 1.0,
  }
  const guideStage = Math.min(Math.max(user.avatarStage ?? 1, 1), 5)
  const guideStageName = readGuideStageConfig(guideStages, guideStage).name
  const retrievalTraces = entry.councilSession?.generationTraces ?? []
  const selectedSources = retrievalTraces
    .filter((trace) => trace.validationStatus === "selected")
    .map((trace) => {
      const output = trace.outputJson as {
        title?: string
        rank?: number
        displayExcerpt?: string | null
        matchedTerms?: string[]
      } | null
      return {
        id: trace.sourceChunkId ?? trace.id,
        title: output?.title ?? trace.sourceChunk?.sourceDocument.title ?? sessionMessages.approvedSource,
        rank: output?.rank ?? 0,
        displayExcerpt: output?.displayExcerpt ?? null,
        matchedTerms: output?.matchedTerms ?? [],
      }
    })
  const sourceMode = entry.councilSession?.sourceMode ?? "none"
  const sourceMessage = buildSourceProvenanceMessage(sourceMode)
  const latestCalibrationReview = entry.councilSession?.qualityReviews[0]
  const hasCalibrationFeedback = (entry.councilSession?.feedback.length ?? 0) > 0
  const hasCalibrationFeedbackNote = Boolean(entry.councilSession?.feedback.some((feedback) => feedback.note?.trim()))
  const calibrationStatus = latestCalibrationReview
    ? describeCalibrationStatus(latestCalibrationReview.label, latestCalibrationReview.severity, sessionMessages)
    : hasCalibrationFeedback
      ? sessionMessages.feedbackReceived
      : sessionMessages.feedbackNeeded
  const calibrationGuidance = founderCalibrationMode
    ? readSavedSessionCalibrationGuidance({
        hasFeedback: hasCalibrationFeedback,
        hasFeedbackNote: hasCalibrationFeedbackNote,
        latestReviewLabel: latestCalibrationReview?.label,
        latestReviewSeverity: latestCalibrationReview?.severity,
      })
    : null
  const founderReviewSummary = founderCalibrationMode
    ? readFounderReviewSummary({
        reviewLabel: latestCalibrationReview?.label,
        reviewSeverity: latestCalibrationReview?.severity,
      })
    : null
  const feedbackMessage = readFeedbackMessage(query.feedback, sessionMessages)

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[13px] font-light text-[var(--plum-soft)] hover:text-[var(--primary)] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {journalMessages.backToDashboard}
      </Link>

      {/* Date header */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1.5">
          {journalMessages.entryEyebrow}
        </p>
        <h1 className="font-display text-[32px] font-light leading-tight text-[var(--primary)]">
          {dateLabel}
        </h1>
      </div>

      {feedbackMessage && (
        <div
          className="rounded-2xl border px-5 py-4"
          style={{
            background: feedbackMessage.tone === "warning" ? "rgba(147,62,62,0.08)" : "rgba(184,137,90,0.08)",
            borderColor: feedbackMessage.tone === "warning" ? "rgba(147,62,62,0.18)" : "rgba(184,137,90,0.18)",
          }}
        >
          <p className="text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
            {feedbackMessage.text}
          </p>
        </div>
      )}

      <DeleteJournalEntryForm action={deleteJournalEntryAction} journalEntryId={entry.id} labels={sessionMessages.delete} />

      {/* Entry text */}
      <div
        className="rounded-2xl border p-7"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(43,27,53,0.07)",
        }}
      >
        <p
          className="font-display text-[17px] font-light leading-[1.85] text-[var(--primary)] whitespace-pre-wrap journal-lines"
          style={{ paddingBottom: "1rem" }}
        >
          {entry.rawText}
        </p>
      </div>

      {/* Council reflection */}
      {r ? (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "var(--primary)",
            borderColor: "var(--primary)",
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center px-7 pt-7 pb-5">
            <AvatarOrb size="sm" stage={guideStage as 1|2|3|4|5} className="mb-3" priority />
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay-light)] mb-0.5">
              {sessionMessages.councilReflection}
            </p>
            <p className="font-display text-[18px] font-light text-[var(--cream)]">
              {sessionMessages.stageLine.replace("{name}", guideStageName).replace("{stage}", String(guideStage))}
            </p>
          </div>

          <div
            className="mx-7 mb-1"
            style={{ height: "1px", background: "rgba(255,255,255,0.08)" }}
          />

          <div className="px-7 py-6 space-y-5">
            {r.openingLine && (
              <p className="text-[14px] font-light leading-[1.7] text-[var(--cream)]/70">
                {r.openingLine}
              </p>
            )}

            {r.mirror && (
              <p className="font-display italic text-[18px] font-light leading-[1.75] text-[var(--cream)]">
                &ldquo;{r.mirror}&rdquo;
              </p>
            )}

            {r.patternName && (
              <span
                className="inline-block text-[11px] font-medium px-3 py-1 rounded-full"
                style={{
                  background: "rgba(184,137,90,0.18)",
                  color: "var(--clay-light)",
                }}
              >
                {r.patternName}
              </span>
            )}

            {r.socraticQuestion && (
              <div
                className="rounded-xl px-5 py-4 border-l-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderLeftColor: "var(--clay)",
                }}
              >
                <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-[var(--clay-light)] mb-2">
                  {sessionMessages.reflectOnThis}
                </p>
                <p className="font-display italic text-[16px] font-light leading-[1.7] text-[var(--cream)]/80">
                  {r.socraticQuestion}
                </p>
              </div>
            )}

            {r.integrationStep && (
              <div
                className="rounded-xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-[var(--clay-light)] mb-2">
                  {sessionMessages.integrationStep}
                </p>
                <p className="text-[14px] font-light leading-[1.7] text-[var(--cream)]/75">
                  {r.integrationStep}
                </p>
              </div>
            )}

            {r.closingLine && (
              <p className="text-[13px] font-light italic text-[var(--cream)]/50 pt-1">
                {r.closingLine}
              </p>
            )}

            {speakText && (
              <div
                className="pt-3 border-t"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              >
                <AudioPlayer
                  text={speakText}
                  voiceGender={voicePrefs.gender}
                  voiceStyle={voicePrefs.style}
                  voiceSpeed={voicePrefs.speed}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl border border-dashed p-8 text-center"
          style={{ borderColor: "rgba(43,27,53,0.12)" }}
        >
          <p className="font-display text-[18px] font-light text-[var(--plum-soft)]">
            {sessionMessages.noReflection}
          </p>
        </div>
      )}

      {entry.councilSession && (
        <div
          className="rounded-2xl border p-7"
          style={{
            background: "var(--pearl)",
            borderColor: "rgba(43,27,53,0.07)",
          }}
        >
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-3">
            {sessionMessages.innerCouncil}
          </p>
          {entry.councilSession.synthesis && (
            <div
              className="rounded-xl px-5 py-4"
              style={{
                background: "rgba(184,137,90,0.07)",
                border: "1px solid rgba(184,137,90,0.15)",
              }}
            >
              <p className="font-display italic text-[17px] font-medium leading-[1.65] text-[var(--primary)]">
                {entry.councilSession.synthesis.integratorQuestion}
              </p>
              <p className="mt-3 text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
                {entry.councilSession.synthesis.integrationStep}
              </p>
            </div>
          )}
          <div className="mt-5 space-y-3">
            {entry.councilSession.messages.map((message) => (
              <div key={message.id} className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
                <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--clay)]">
                  {message.displayName}
                </p>
                <p className="mt-1 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
                  {message.abstained ? sessionMessages.quietVoice : message.content}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
            <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)]">
              {founderCalibrationMode ? sessionMessages.calibrationStatus : sessionMessages.sessionStatus}
            </p>
            <p className="mt-1 text-[12px] font-light text-[var(--plum-soft)]">
              {entry.councilSession.embodimentGateResponses.length > 0 ? sessionMessages.gateSaved : sessionMessages.gateNotSaved} · {entry.councilSession.feedback.length > 0 ? sessionMessages.feedbackReceived : sessionMessages.feedbackNeeded}
            </p>
            {founderCalibrationMode && (
              <p className="mt-1 text-[12px] font-light text-[var(--plum-soft)]">
                {sessionMessages.calibrationPrefix.replace("{status}", calibrationStatus)}
              </p>
            )}
            {calibrationGuidance && (
              <div className="mt-3 rounded-xl border px-3 py-2" style={{ borderColor: "rgba(184,137,90,0.18)", background: "rgba(184,137,90,0.07)" }}>
                <p className="text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
                  {calibrationGuidance}
                </p>
              </div>
            )}
            {founderReviewSummary && (
              <div className="mt-3 rounded-xl border px-3 py-2" style={{ borderColor: "rgba(43,27,53,0.08)", background: "rgba(255,255,255,0.36)" }}>
                <p className="text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
                  {founderReviewSummary}
                </p>
              </div>
            )}
            <p className="mt-2 text-[12px] font-light leading-relaxed text-[var(--plum-soft)]/75">
              {founderCalibrationMode
                ? sessionMessages.feedbackCalibrationNote
                : sessionMessages.feedbackSessionNote}
            </p>
            {founderCalibrationMode && (
              <p className="mt-2 text-[12px] font-light leading-relaxed text-[var(--clay)]">
                {sessionMessages.feedbackPrompt}
              </p>
            )}
            {entry.councilSession.feedback.length > 0 && (
              <div className="mt-3 space-y-2">
                {entry.councilSession.feedback.map((feedback) => {
                  const note = feedback.note?.trim()
                  return (
                    <div key={feedback.id} className="rounded-xl border px-3 py-2 text-[11px] font-light leading-relaxed text-[var(--plum-soft)]" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
                      <p>
                        <span className="font-medium text-[var(--primary)]">{feedbackTypeLabels[feedback.feedbackType] ?? formatFeedbackType(feedback.feedbackType)}</span>
                        {note ? ` · ${messages.common.noteSaved}` : ` · ${messages.common.noNote}`}
                      </p>
                      {note && (
                        <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--plum-soft)]/80">
                          {sessionMessages.noteLabel.replace("{note}", note)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <SavedSessionFeedbackForm
              action={submitSavedSessionFeedbackAction}
              councilSessionId={entry.councilSession.id}
              founderCalibrationMode={founderCalibrationMode}
              labels={{
                ...sessionMessages.feedbackForm,
                feedbackTypes: feedbackTypeLabels,
              }}
            />
          </div>
        </div>
      )}

      {entry.councilSession && (
        <div
          className="rounded-2xl border p-7"
          style={{
            background: "var(--pearl)",
            borderColor: "rgba(43,27,53,0.07)",
          }}
        >
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-2">
            {sessionMessages.sourceGrounding}
          </p>
          <p className="text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
            {sourceMessage}
          </p>
          {selectedSources.length > 0 && (
            <div className="mt-4 space-y-2">
              {selectedSources.map((source) => (
                <div key={source.id} className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
                  <p className="text-[12px] font-medium text-[var(--primary)]">
                    {source.rank ? `${source.rank}. ` : ""}{source.title}
                  </p>
                  {source.matchedTerms.length > 0 && (
                    <p className="mt-1 text-[11px] font-light text-[var(--plum-soft)]/70">
                      {sessionMessages.matchedTerms.replace("{terms}", source.matchedTerms.slice(0, 4).join(", "))}
                    </p>
                  )}
                  {source.displayExcerpt && (
                    <p className="mt-2 text-[12px] font-light italic leading-relaxed text-[var(--plum-soft)]">
                      {source.displayExcerpt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function describeCalibrationStatus(label: string, severity: string, messages: ReturnType<typeof getWebMessages>["sessionDetail"]) {
  if (severity === "pilot_blocker") return messages.statusNeedsAttention
  if (label === "ready") return messages.statusReady
  if (label === "voice_good" || label === "source_good") return messages.statusGoodEnough
  if (label === "voice_wrong") return messages.statusVoiceIssue
  if (label === "source_unsupported") return messages.statusSourceIssue
  if (label === "too_generic" || label === "too_intense") return messages.statusPromptIssue
  return label.replaceAll("_", " ")
}

function readFeedbackMessage(status: string | undefined, messages: ReturnType<typeof getWebMessages>["sessionDetail"]) {
  if (status === "saved") {
    return { tone: "success", text: messages.feedbackSaved } as const
  }
  if (status === "note_required") {
    return { tone: "warning", text: messages.feedbackTypeRequired } as const
  }
  return null
}

function formatFeedbackType(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
