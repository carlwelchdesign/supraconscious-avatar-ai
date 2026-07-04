import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { AvatarOrb } from "@inner-avatar/ui/avatar-orb"
import { AudioPlayer } from "@/components/voice/AudioPlayer"
import { buildSpeakText } from "@/lib/voice/voice-config"
import { deleteJournalEntryAction, submitSavedSessionFeedbackAction } from "./actions"

export default async function JournalEntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const user = await requireAppUser()
  const { entryId } = await params
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: user.id },
    include: {
      analysis: true,
      avatarResponse: true,
      generatedPrompts: true,
      councilSession: {
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          synthesis: true,
          feedback: true,
          embodimentGateResponses: true,
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
  })

  if (!entry) notFound()

  const date = new Date(entry.createdAt)
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const r = entry.avatarResponse
  const speakText = r ? buildSpeakText(r) : ""
  const voicePrefs = {
    gender: user.voiceGender ?? "female",
    style: user.voiceStyle ?? "warm",
    speed: user.voiceSpeed ?? 1.0,
  }
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
        title: output?.title ?? trace.sourceChunk?.sourceDocument.title ?? "Approved source",
        rank: output?.rank ?? 0,
        displayExcerpt: output?.displayExcerpt ?? null,
        matchedTerms: output?.matchedTerms ?? [],
      }
    })
  const sourceMode = entry.councilSession?.sourceMode ?? "none"
  const sourceMessage = sourceMode === "rag"
    ? "This reflection used approved source material as background. The response is paraphrased unless a quoted excerpt is shown."
    : "No approved source material matched this entry. Your reflection used only your journal text and the app's guidance rules."

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[13px] font-light text-[var(--plum-soft)] hover:text-[var(--primary)] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to dashboard
      </Link>

      {/* Date header */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1.5">
          Journal entry
        </p>
        <h1 className="font-display text-[32px] font-light leading-tight text-[var(--primary)]">
          {dateLabel}
        </h1>
      </div>

      <form action={deleteJournalEntryAction}>
        <input type="hidden" name="journalEntryId" value={entry.id} />
        <button className="rounded-full border px-4 py-2 text-[12px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)]" style={{ borderColor: "rgba(43,27,53,0.08)" }}>
          Delete this entry
        </button>
      </form>

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

      {/* Avatar reflection */}
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
            <AvatarOrb size="sm" stage={(user.avatarStage ?? 1) as 1|2|3|4|5} className="mb-3" />
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay-light)] mb-0.5">
              Avatar reflection
            </p>
            <p className="font-display text-[18px] font-light text-[var(--cream)]">
              Echo · Stage {user.avatarStage ?? 1}
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
                  Reflect on this
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
                  An integration step
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
            No reflection was generated for this entry.
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
            Inner Council
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
                  {message.abstained ? "This voice was quiet while grounding came first." : message.content}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border px-4 py-3" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
            <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)]">
              Pilot status
            </p>
            <p className="mt-1 text-[12px] font-light text-[var(--plum-soft)]">
              {entry.councilSession.embodimentGateResponses.length > 0 ? "Gate saved" : "Gate not saved"} · {entry.councilSession.feedback.length > 0 ? "Feedback received" : "Feedback needed"}
            </p>
            <p className="mt-2 text-[12px] font-light leading-relaxed text-[var(--plum-soft)]/75">
              Feedback is reviewed by the pilot team; it does not automatically retrain the guide.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["helpful", "Helpful"],
                ["not_accurate", "Not accurate"],
                ["too_intense", "Too intense"],
                ["unclear", "Unclear"],
                ["unsupported_source", "Report source issue"],
              ].map(([value, label]) => (
                <form key={value} action={submitSavedSessionFeedbackAction}>
                  <input type="hidden" name="councilSessionId" value={entry.councilSession!.id} />
                  <input type="hidden" name="feedbackType" value={value} />
                  <button className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)]" style={{ borderColor: "rgba(43,27,53,0.08)" }}>
                    {label}
                  </button>
                </form>
              ))}
            </div>
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
            Source grounding
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
                      Matched {source.matchedTerms.slice(0, 4).join(", ")}
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
