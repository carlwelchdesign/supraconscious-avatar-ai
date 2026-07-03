"use client"

import { useState } from "react"
import { Loader2, ArrowRight } from "lucide-react"
import { AvatarOrb } from "@inner-avatar/ui/avatar-orb"
import { MicButton } from "@/components/voice/MicButton"
import { AudioPlayer } from "@/components/voice/AudioPlayer"
import { buildSpeakText } from "@/lib/voice/voice-config"

const AVATAR_STAGES = ["Echo", "Witness", "Clear Mirror", "Reframer", "Inner Author"] as const
const LEVELS = ["Awareness", "Pattern Recognition", "Honest Reflection", "Reframing", "Conscious Choice"] as const

type AnalysisResult = {
  journalEntry?: {
    id: string
  }
  safety: { severity: string; flags: string[] }
  analysis: { summary: string } | null
  avatarResponse: {
    openingLine: string | null
    mirror: string | null
    patternName: string | null
    contradiction: string | null
    socraticQuestion: string | null
    integrationStep: string | null
    closingLine: string | null
  }
  prompt: {
    title: string
    context: string
    materials: string | null
    execution: string
    integration: string
  }
  progression: {
    levelChanged: boolean
    stageChanged: boolean
    newLevel: number
    newStage: number
    previousLevel: number
    previousStage: number
  }
  councilSession?: {
    id: string
    observerSignal: {
      coreTension?: string
      emotionalTone?: string
      patternLanguage?: string[]
      contradiction?: string
      userEvidence?: string[]
    }
    messages: Array<{
      id: string
      role: string
      displayName: string
      lens: string
      content: string
      confidence: number
      abstained: boolean
    }>
    synthesis: {
      integratorQuestion: string
      integrationStep: string
      coreTension: string | null
    } | null
  }
  sourceProvenance?: {
    sourceMode: string
    message: string
    pilotScope?: string
    sources: Array<{
      id: string
      title: string
      rank: number
      score?: number
      matchedTerms?: string[]
      matchedFields?: string[]
      allowedUse: string
      displayExcerpt: string | null
    }>
  }
}

type VoicePrefs = {
  voiceEnabled: boolean
  voiceAutoPlay: boolean
  voiceGender: string
  voiceStyle: string
  voiceSpeed: number
}

type ThresholdPrompt = {
  id: string
  month: number
  day: number
  theme: string
  quote: string | null
  frameOfThought: string
  socraticQuestion: string
} | null

type Props = {
  avatarStage?: 1 | 2 | 3 | 4 | 5
  voicePrefs?: VoicePrefs
  thresholdPrompt?: ThresholdPrompt
}

export function JournalWorkspace({ avatarStage = 1, voicePrefs, thresholdPrompt = null }: Props) {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingShift, setIsSavingShift] = useState(false)
  const [isSavingFeedback, setIsSavingFeedback] = useState(false)
  const [error, setError] = useState("")
  const [embodimentText, setEmbodimentText] = useState("")
  const [embodimentSaved, setEmbodimentSaved] = useState(false)
  const [feedbackSaved, setFeedbackSaved] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const voice = voicePrefs ?? {
    voiceEnabled: false,
    voiceAutoPlay: false,
    voiceGender: "female",
    voiceStyle: "warm",
    voiceSpeed: 1.0,
  }

  async function handleSubmit() {
    setError("")
    setResult(null)
    setEmbodimentText("")
    setEmbodimentSaved(false)
    setFeedbackSaved("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/journal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "Reflection failed.")
      setResult(payload)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reflection failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTranscribe = (transcribed: string) => {
    setText((prev) => (prev.trim() ? `${prev}\n${transcribed}` : transcribed))
  }

  async function handleSaveEmbodiment() {
    if (!result?.councilSession || !embodimentText.trim()) return

    setError("")
    setIsSavingShift(true)
    try {
      const response = await fetch("/api/council/embodiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          councilSessionId: result.councilSession.id,
          journalEntryId: result.journalEntry?.id,
          text: embodimentText,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "Unable to save your shift.")
      setEmbodimentSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save your shift.")
    } finally {
      setIsSavingShift(false)
    }
  }

  async function handleSessionFeedback(feedbackType: string) {
    if (!result?.councilSession) return
    setError("")
    setIsSavingFeedback(true)
    try {
      const response = await fetch("/api/council/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          councilSessionId: result.councilSession.id,
          feedbackType,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "Unable to save feedback.")
      setFeedbackSaved(feedbackType)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save feedback.")
    } finally {
      setIsSavingFeedback(false)
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const speakText = result
    ? buildSpeakText(result.avatarResponse)
    : ""
  const signalLabel = (confidence: number) => {
    if (confidence >= 0.75) return "Strong recurring signal"
    if (confidence >= 0.55) return "Based on your entry"
    return "Light signal"
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1">
          Journal
        </p>
        <h1 className="font-display text-[40px] font-light text-[var(--primary)] leading-tight">
          What is present today?
        </h1>
        <p className="mt-2 text-[14px] font-light text-[var(--plum-soft)]">
          Inspired by Maria Olon Tsaroucha&apos;s teachings. This guide is not Maria, not therapy, and not a spiritual authority.
        </p>
      </div>

      {thresholdPrompt && (
        <section
          className="rounded-3xl border px-6 py-5"
          style={{
            background: "var(--pearl)",
            borderColor: "rgba(43,27,53,0.07)",
            boxShadow: "0 4px 24px rgba(43,27,53,0.05)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)]">
              Threshold · Month {thresholdPrompt.month}, Day {thresholdPrompt.day}
            </p>
            <p className="text-[11px] font-light text-[var(--plum-soft)]">{thresholdPrompt.theme}</p>
          </div>
          {thresholdPrompt.quote && (
            <p className="mt-3 font-display text-[18px] font-light italic leading-relaxed text-[var(--primary)]">
              {thresholdPrompt.quote}
            </p>
          )}
          <p className="mt-3 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
            {thresholdPrompt.frameOfThought}
          </p>
          <p className="mt-4 font-display text-[17px] font-medium italic leading-relaxed text-[var(--primary)]">
            {thresholdPrompt.socraticQuestion}
          </p>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

        {/* ── Editor ─────────────────────────────────────────────── */}
        <section className="space-y-0">
          <div
            className="rounded-3xl border overflow-hidden"
            style={{
              background: "var(--pearl)",
              borderColor: "rgba(43,27,53,0.08)",
              boxShadow: "0 4px 32px rgba(43,27,53,0.06)",
            }}
          >
            {/* Editor top bar */}
            <div
              className="flex items-center justify-between px-8 py-4 border-b"
              style={{ borderColor: "rgba(43,27,53,0.06)" }}
            >
              <span className="text-[12px] font-light text-[var(--plum-soft)]">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-[12px] font-light text-[var(--plum-soft)]">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
            </div>

            {/* Writing area */}
            <div className="px-8 pt-6 pb-8">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write what is present — emotions, observations, tensions. No structure required…"
                className="w-full min-h-[340px] resize-none bg-transparent outline-none font-display text-[18px] font-light leading-[1.95] text-[var(--primary)] placeholder:text-[var(--primary)]/20 journal-lines"
                style={{ caretColor: "var(--clay)" }}
              />
            </div>

            {/* Editor footer */}
            <div
              className="flex items-center justify-between px-8 py-4 border-t"
              style={{ borderColor: "rgba(43,27,53,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <p className="text-[12px] font-light text-[var(--plum-soft)]/70">
                  Private by default · Pattern memory adjustable in settings
                </p>
                {voice.voiceEnabled && (
                  <MicButton onTranscribe={handleTranscribe} disabled={isSubmitting} />
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || text.trim().length < 20}
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-[14px] font-medium px-6 py-2.5 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {isSubmitting ? "Reflecting…" : "Reflect"}
              </button>
            </div>
            {text.trim().length > 0 && text.trim().length < 20 && (
              <p className="px-8 pb-4 text-[11px] font-light text-[var(--plum-soft)]/70">
                Add a little more context so the council can reflect without guessing.
              </p>
            )}
          </div>

          {error && (
            <div
              className="mt-3 rounded-2xl px-5 py-4 text-[13px] font-light"
              style={{
                background: "rgba(191,64,64,0.07)",
                border: "1px solid rgba(191,64,64,0.2)",
                color: "var(--destructive)",
              }}
            >
              {error}
            </div>
          )}
        </section>

        {/* ── Reflection panel ───────────────────────────────────── */}
        <aside className="space-y-4">

          {/* Avatar header */}
          <div
            className="rounded-3xl border p-6"
            style={{
              background: "var(--pearl)",
              borderColor: "rgba(43,27,53,0.07)",
            }}
          >
            <div className="flex flex-col items-center text-center mb-5">
              <AvatarOrb size="lg" stage={result ? result.progression.newStage as 1|2|3|4|5 : avatarStage} className="mb-3" />
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)]">
                Avatar Response
              </p>
              <p className="text-[12px] font-light text-[var(--plum-soft)]">
                {result
                  ? `${AVATAR_STAGES[result.progression.newStage - 1]} · Stage ${result.progression.newStage}`
                  : `${AVATAR_STAGES[avatarStage - 1]} · Stage ${avatarStage}`}
              </p>
            </div>

            {result ? (
              <div className="space-y-4">
                {result.avatarResponse.openingLine && (
                  <p className="font-display text-[16px] font-medium text-[var(--primary)] leading-snug">
                    {result.avatarResponse.openingLine}
                  </p>
                )}
                {result.avatarResponse.mirror && (
                  <p className="font-display italic text-[15px] font-light text-[var(--plum-soft)] leading-[1.75]">
                    {result.avatarResponse.mirror}
                  </p>
                )}
                {result.avatarResponse.patternName && (
                  <div
                    className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.1em] uppercase px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(184,137,90,0.08)",
                      color: "var(--clay)",
                    }}
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--clay)]" />
                    {result.avatarResponse.patternName}
                  </div>
                )}
                {result.avatarResponse.contradiction && (
                  <p className="text-[14px] font-light text-[var(--plum-soft)] leading-relaxed">
                    {result.avatarResponse.contradiction}
                  </p>
                )}
                {result.avatarResponse.socraticQuestion && (
                  <div
                    className="rounded-2xl px-5 py-4 border-l-2"
                    style={{
                      background: "rgba(43,27,53,0.03)",
                      borderLeftColor: "var(--clay)",
                    }}
                  >
                    <p className="font-display italic text-[15px] font-medium text-[var(--primary)] leading-[1.65]">
                      {result.avatarResponse.socraticQuestion}
                    </p>
                  </div>
                )}
                {result.avatarResponse.integrationStep && (
                  <div
                    className="rounded-2xl px-5 py-4"
                    style={{
                      background: "rgba(184,137,90,0.07)",
                      border: "1px solid rgba(184,137,90,0.15)",
                    }}
                  >
                    <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--clay)] mb-2">
                      One grounded step
                    </p>
                    <p className="text-[14px] font-light text-[var(--plum-soft)] leading-relaxed">
                      {result.avatarResponse.integrationStep}
                    </p>
                  </div>
                )}
                {result.avatarResponse.closingLine && (
                  <p className="text-[13px] font-light text-[var(--plum-soft)]/60 italic">
                    {result.avatarResponse.closingLine}
                  </p>
                )}

                {/* Audio player — only shown if safety allows and voice is configured */}
                {speakText && result.safety.severity !== "high" && (
                  <div
                    className="pt-2 border-t"
                    style={{ borderColor: "rgba(43,27,53,0.06)" }}
                  >
                    <AudioPlayer
                      text={speakText}
                      voiceGender={voice.voiceGender}
                      voiceStyle={voice.voiceStyle}
                      voiceSpeed={voice.voiceSpeed}
                      autoPlay={voice.voiceAutoPlay}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="font-display italic text-[15px] font-light text-[var(--plum-soft)]/60 leading-relaxed">
                Your reflection will appear here after you write and submit an entry.
              </p>
            )}
          </div>

          {result?.councilSession && (
            <div
              className="rounded-3xl border p-6"
              style={{
                background: "var(--pearl)",
                borderColor: "rgba(43,27,53,0.07)",
              }}
            >
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)] mb-2">
                Inner Council
              </p>
              <h2 className="font-display text-[22px] font-light text-[var(--primary)] leading-snug">
                {result.councilSession.observerSignal.coreTension ?? "The Council has gathered around the pattern."}
              </h2>
              {result.councilSession.observerSignal.contradiction && (
                <p className="mt-3 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
                  {result.councilSession.observerSignal.contradiction}
                </p>
              )}

              <div className="mt-5 space-y-3">
                {result.councilSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      background: "rgba(43,27,53,0.025)",
                      borderColor: "rgba(43,27,53,0.06)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--clay)]">
                        {message.displayName}
                      </p>
                      <span className="text-[10px] font-light text-[var(--plum-soft)]">
                        {message.abstained ? "Grounding" : signalLabel(message.confidence)}
                      </span>
                    </div>
                    <p className="text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
                      {message.abstained ? "This voice is quiet while grounding comes first." : message.content}
                    </p>
                  </div>
                ))}
              </div>

              {result.councilSession.synthesis && (
                <div
                  className="mt-5 rounded-2xl px-5 py-4"
                  style={{
                    background: "rgba(184,137,90,0.08)",
                    border: "1px solid rgba(184,137,90,0.18)",
                  }}
                >
                  <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)] mb-2">
                    Supraconscious Guide
                  </p>
                  <p className="font-display italic text-[17px] font-medium leading-[1.55] text-[var(--primary)]">
                    {result.councilSession.synthesis.integratorQuestion}
                  </p>
                </div>
              )}
            </div>
          )}

          {result?.councilSession && (
            <div
              className="rounded-3xl border p-6"
              style={{
                background: "var(--pearl)",
                borderColor: "rgba(43,27,53,0.07)",
              }}
            >
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)] mb-2">
                Session feedback
              </p>
              <p className="text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
                Help tune the pilot. Your feedback is tied to this session, not used as a diagnosis.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["helpful", "Helpful"],
                  ["not_accurate", "Not accurate"],
                  ["too_intense", "Too intense"],
                  ["unclear", "Unclear"],
                  ["unsupported_source", "Report source issue"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={isSavingFeedback}
                    onClick={() => handleSessionFeedback(value)}
                    className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] transition hover:bg-[rgba(43,27,53,0.04)] disabled:opacity-40"
                    style={{ borderColor: "rgba(43,27,53,0.08)" }}
                  >
                    {feedbackSaved === value ? "Saved" : label}
                  </button>
                ))}
              </div>
              {feedbackSaved && (
                <p className="mt-3 text-[11px] font-light text-[var(--plum-soft)]/70">
                  Feedback saved for this pilot session.
                </p>
              )}
            </div>
          )}

          {result?.sourceProvenance && (
            <div
              className="rounded-3xl border p-6"
              style={{
                background: "var(--pearl)",
                borderColor: "rgba(43,27,53,0.07)",
              }}
            >
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)] mb-2">
                Source grounding
              </p>
              <p className="text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
                {result.sourceProvenance.message}
              </p>
              {result.sourceProvenance.pilotScope && (
                <p className="mt-2 text-[11px] font-light leading-relaxed text-[var(--plum-soft)]/70">
                  {result.sourceProvenance.pilotScope}
                </p>
              )}
              {result.sourceProvenance.sources.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.sourceProvenance.sources.map((source) => (
                    <div key={source.id} className="rounded-2xl border px-4 py-3" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
                      <p className="text-[12px] font-medium text-[var(--primary)]">
                        {source.rank}. {source.title}
                      </p>
                      {source.matchedTerms && source.matchedTerms.length > 0 && (
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

          {/* Progression moment */}
          {result?.progression.stageChanged && (
            <div
              className="rounded-3xl border p-6 relative overflow-hidden"
              style={{ background: "var(--primary)", borderColor: "var(--primary)" }}
            >
              <span
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[48px] opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, var(--clay), transparent)" }}
              />
              <div className="relative z-10 text-center space-y-3">
                <AvatarOrb size="lg" stage={result.progression.newStage as 1|2|3|4|5} className="mx-auto" />
                <div>
                  <p className="text-[10px] font-medium tracking-[0.16em] uppercase text-[var(--clay-light)] mb-1">
                    Your Avatar has deepened
                  </p>
                  <p className="font-display text-[22px] font-light text-[var(--cream)] leading-tight">
                    {AVATAR_STAGES[result.progression.previousStage - 1]} is becoming{" "}
                    <em className="italic text-[var(--clay-light)]">
                      {AVATAR_STAGES[result.progression.newStage - 1]}
                    </em>
                  </p>
                </div>
                <p className="text-[13px] font-light text-[var(--cream)]/50">
                  Stage {result.progression.newStage} of 5
                </p>
              </div>
            </div>
          )}

          {result?.progression.levelChanged && !result.progression.stageChanged && (
            <div
              className="rounded-3xl border p-5"
              style={{
                background: "rgba(184,137,90,0.07)",
                borderColor: "rgba(184,137,90,0.18)",
              }}
            >
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1">
                Reflection depth
              </p>
              <p className="font-display text-[16px] font-light text-[var(--primary)]">
                You are entering{" "}
                <em className="italic">{LEVELS[result.progression.newLevel - 1]}</em>
              </p>
            </div>
          )}

          {/* Generated prompt */}
          {(result || !result) && (
            <div
              className="rounded-3xl border p-6"
              style={{
                background: "var(--pearl)",
                borderColor: "rgba(43,27,53,0.07)",
              }}
            >
              <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--plum-soft)] mb-4">
                Generated Prompt
              </p>
              {result ? (
                <div className="space-y-3">
                  <h3 className="font-display text-[20px] font-medium text-[var(--primary)] leading-snug">
                    {result.prompt.title}
                  </h3>
                  <p className="text-[14px] font-light text-[var(--plum-soft)] leading-relaxed">
                    {result.prompt.context}
                  </p>
                  {result.prompt.materials && (
                    <p className="text-[13px] font-light text-[var(--plum-soft)]/70 leading-relaxed">
                      {result.prompt.materials}
                    </p>
                  )}
                  <p className="text-[14px] font-light text-[var(--plum-soft)] leading-relaxed">
                    {result.prompt.execution}
                  </p>
                  <p className="text-[14px] font-medium text-[var(--primary)] leading-relaxed">
                    {result.prompt.integration}
                  </p>
                </div>
              ) : (
                <p className="font-display italic text-[15px] font-light text-[var(--plum-soft)]/60 leading-relaxed">
                  A grounded prompt will be generated from your reflection.
                </p>
              )}
            </div>
          )}

          {result?.councilSession && (
            <div
              className="rounded-3xl border p-6"
              style={{
                background: "var(--primary)",
                borderColor: "var(--primary)",
              }}
            >
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay-light)] mb-2">
                Embodiment Gate
              </p>
              <h3 className="font-display text-[22px] font-light text-[var(--cream)] leading-tight">
                What is one small shift you can carry today?
              </h3>
              <p className="mt-2 text-[13px] font-light text-[var(--cream)]/60">
                Save this as today&apos;s small shift.
              </p>
              <textarea
                value={embodimentText}
                onChange={(event) => {
                  setEmbodimentText(event.target.value)
                  setEmbodimentSaved(false)
                }}
                placeholder="One small shift..."
                className="mt-4 w-full min-h-[110px] resize-none rounded-2xl border bg-[rgba(244,237,228,0.06)] px-4 py-3 text-[14px] font-light leading-relaxed text-[var(--cream)] outline-none placeholder:text-[var(--cream)]/35"
                style={{ borderColor: "rgba(244,237,228,0.14)" }}
              />
              <button
                type="button"
                onClick={handleSaveEmbodiment}
                disabled={isSavingShift || embodimentText.trim().length < 3 || embodimentSaved}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--cream)] px-5 py-2.5 text-[13px] font-medium text-[var(--primary)] disabled:opacity-45"
              >
                {isSavingShift ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {embodimentSaved ? "Gate crossed" : "Cross the Gate"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
