"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Loader2, ArrowRight } from "lucide-react"
import {
  FOUNDER_CALIBRATION_SCENARIO_PROMPTS,
  type FounderCalibrationScenario,
} from "@inner-avatar/ai/founder-calibration-scenarios"
import { FOUNDER_FEEDBACK_NOTE_TEMPLATES } from "@inner-avatar/ai/founder-feedback-notes"
import { AvatarOrb } from "@inner-avatar/ui/avatar-orb"
import { MicButton } from "@/components/voice/MicButton"
import { AudioPlayer } from "@/components/voice/AudioPlayer"
import { resolveFounderCalibrationSubmissionScenario } from "@/lib/founder-calibration-submit"
import { buildSpeakText } from "@/lib/voice/voice-config"

const DEFAULT_STAGE_NAMES = ["Echo", "Witness", "Clear Mirror", "Reframer", "Inner Author"] as const
const LEVELS = ["Awareness", "Pattern Recognition", "Honest Reflection", "Reframing", "Conscious Choice"] as const
const CALIBRATION_PROMPTS = [
  {
    scenario: "voice_test",
    text: FOUNDER_CALIBRATION_SCENARIO_PROMPTS.voice_test,
  },
  {
    scenario: "source_grounding_test",
    text: FOUNDER_CALIBRATION_SCENARIO_PROMPTS.source_grounding_test,
  },
  {
    scenario: "embodiment_test",
    text: FOUNDER_CALIBRATION_SCENARIO_PROMPTS.embodiment_test,
  },
  {
    scenario: "no_source_fallback_test",
    text: FOUNDER_CALIBRATION_SCENARIO_PROMPTS.no_source_fallback_test,
  },
  {
    scenario: "intensity_boundary_test",
    text: FOUNDER_CALIBRATION_SCENARIO_PROMPTS.intensity_boundary_test,
  },
] as const
const CALIBRATION_PROMPT_TEXTS = new Set<string>(CALIBRATION_PROMPTS.map((prompt) => prompt.text))
type ThresholdPromptTranslationKey = "purpose"

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

function readThresholdPromptTranslationKey(prompt: ThresholdPrompt): ThresholdPromptTranslationKey | null {
  if (!prompt) return null

  const theme = prompt.theme.trim().toLowerCase()
  const quote = prompt.quote?.trim().toLowerCase()
  const frame = prompt.frameOfThought.trim().toLowerCase()
  const question = prompt.socraticQuestion.trim().toLowerCase()

  if (
    theme === "purpose" ||
    quote === "the soul whispers before destiny speaks." ||
    frame === "purpose rarely arrives as a command. it often begins as a quiet invitation." ||
    question === "what invitation have you been ignoring?"
  ) {
    return "purpose"
  }

  return null
}

type Props = {
  avatarStage?: 1 | 2 | 3 | 4 | 5
  stageNames?: readonly string[]
  voicePrefs?: VoicePrefs
  thresholdPrompt?: ThresholdPrompt
  todayLabel?: string
  founderCalibrationMode?: boolean
  suggestedCalibrationScenario?: Exclude<FounderCalibrationScenario, "freeform">
  needsFounderFirstSessionGuide?: boolean
  needsFounderFeedback?: boolean
  founderFeedbackHref?: string | null
}

export function JournalWorkspace({
  avatarStage = 1,
  stageNames = DEFAULT_STAGE_NAMES,
  voicePrefs,
  thresholdPrompt = null,
  todayLabel = "",
  founderCalibrationMode = false,
  suggestedCalibrationScenario,
  needsFounderFirstSessionGuide = false,
  needsFounderFeedback = false,
  founderFeedbackHref = null,
}: Props) {
  const t = useTranslations("journal")
  const feedbackT = useTranslations("sessionDetail.feedbackTypes")
  const guideStageNames = normalizeStageNames(stageNames)
  const suggestedPrompt = suggestedCalibrationScenario
    ? CALIBRATION_PROMPTS.find((prompt) => prompt.scenario === suggestedCalibrationScenario)
    : null
  const suggestedPromptLabel = suggestedPrompt
    ? t(`calibrationScenarios.${suggestedPrompt.scenario}`)
    : ""
  const initialText = founderCalibrationMode && needsFounderFirstSessionGuide && suggestedPrompt
    ? suggestedPrompt.text
    : ""

  const [text, setText] = useState(initialText)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingShift, setIsSavingShift] = useState(false)
  const [isSavingFeedback, setIsSavingFeedback] = useState(false)
  const [error, setError] = useState("")
  const [embodimentText, setEmbodimentText] = useState("")
  const [embodimentSaved, setEmbodimentSaved] = useState(false)
  const [feedbackSaved, setFeedbackSaved] = useState("")
  const [feedbackNote, setFeedbackNote] = useState("")
  const [calibrationScenario, setCalibrationScenario] = useState<FounderCalibrationScenario>(suggestedCalibrationScenario ?? "freeform")
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
    setFeedbackNote("")
    setIsSubmitting(true)

    try {
      const submittedCalibrationScenario = resolveFounderCalibrationSubmissionScenario({
        founderCalibrationMode,
        text,
        selectedScenario: calibrationScenario,
      })
      const response = await fetch("/api/journal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, calibrationScenario: submittedCalibrationScenario }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(userFacingJournalError(payload.error, response.status, t))
      setResult(payload)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transientError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTranscribe = (transcribed: string) => {
    setText((prev) => (prev.trim() ? `${prev}\n${transcribed}` : transcribed))
  }

  const applyCalibrationPrompt = (prompt: (typeof CALIBRATION_PROMPTS)[number]) => {
    setCalibrationScenario(prompt.scenario)
    const promptText = prompt.text
    setText((prev) => {
      const trimmed = prev.trim()
      if (!trimmed || CALIBRATION_PROMPT_TEXTS.has(trimmed)) return promptText
      return `${prev}\n\n${promptText}`
    })
  }
  const applyFeedbackTemplate = (template: string) => {
    setFeedbackNote((prev) => (prev.trim() ? `${prev.trim()}\n${template}` : template))
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
      if (!response.ok) throw new Error(userFacingSaveError(payload.error, response.status, "shift", t))
      setEmbodimentSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveShiftError"))
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
          note: feedbackNote.trim() || undefined,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(userFacingSaveError(payload.error, response.status, "feedback", t))
      setFeedbackSaved(feedbackType)
      setFeedbackNote("")
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveFeedbackError"))
    } finally {
      setIsSavingFeedback(false)
    }
  }

  const trimmedText = text.trim()
  const founderFirstSessionNeedsContext = founderCalibrationMode && needsFounderFirstSessionGuide && !result
  const founderOnlyHasPromptText = founderFirstSessionNeedsContext && CALIBRATION_PROMPT_TEXTS.has(trimmedText)
  const canSubmit = trimmedText.length >= 20 && !founderOnlyHasPromptText
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0
  const thresholdPromptTranslationKey = readThresholdPromptTranslationKey(thresholdPrompt)
  const localizedThresholdPrompt = thresholdPrompt
    ? {
        ...thresholdPrompt,
        theme: thresholdPromptTranslationKey
          ? t(`thresholdPrompts.${thresholdPromptTranslationKey}.theme`)
          : thresholdPrompt.theme,
        quote: thresholdPromptTranslationKey && thresholdPrompt.quote
          ? t(`thresholdPrompts.${thresholdPromptTranslationKey}.quote`)
          : thresholdPrompt.quote,
        frameOfThought: thresholdPromptTranslationKey
          ? t(`thresholdPrompts.${thresholdPromptTranslationKey}.frameOfThought`)
          : thresholdPrompt.frameOfThought,
        socraticQuestion: thresholdPromptTranslationKey
          ? t(`thresholdPrompts.${thresholdPromptTranslationKey}.socraticQuestion`)
          : thresholdPrompt.socraticQuestion,
      }
    : null

  const speakText = result
    ? buildSpeakText(result.avatarResponse)
    : ""
  const signalLabel = (confidence: number) => {
    if (confidence >= 0.75) return t("strongSignal")
    if (confidence >= 0.55) return t("basedOnEntry")
    return t("lightSignal")
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-[40px] font-light text-[var(--primary)] leading-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-[14px] font-light text-[var(--plum-soft)]">
          {t("helper")}
        </p>
      </div>

      {founderCalibrationMode && (
        <section
          className="rounded-3xl border px-6 py-5"
          style={{
            background: "var(--pearl)",
            borderColor: "rgba(184,137,90,0.18)",
            boxShadow: "0 4px 24px rgba(184,137,90,0.07)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay)]">
                {t("founderCalibration")}
              </p>
              <p className="mt-2 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
                {t("founderCalibrationBody")}
              </p>
              {suggestedPrompt && (
                <p className="mt-2 rounded-2xl border px-3 py-2 text-[12px] font-light leading-relaxed text-[var(--plum-soft)]" style={{ borderColor: "rgba(184,137,90,0.18)", background: "rgba(184,137,90,0.07)" }}>
                  {needsFounderFirstSessionGuide ? t("suggestedFirstRun") : t("suggestedNextScenario")}: {suggestedPromptLabel}
                </p>
              )}
              {needsFounderFirstSessionGuide && (
                <p className="mt-2 rounded-2xl border px-3 py-2 text-[12px] font-light leading-relaxed text-[var(--plum-soft)]" style={{ borderColor: "rgba(43,27,53,0.08)", background: "rgba(43,27,53,0.035)" }}>
                  {t("firstCalibrationHelp", { label: suggestedPromptLabel || t("calibrationScenarios.freeform") })}
                </p>
              )}
              {needsFounderFeedback && (
                <div className="mt-2 rounded-2xl border px-3 py-2 text-[12px] font-light leading-relaxed text-[var(--plum-soft)]" style={{ borderColor: "rgba(43,27,53,0.08)", background: "rgba(43,27,53,0.035)" }}>
                  <p>
                    {t("firstReflectionSaved")}
                  </p>
                  {founderFeedbackHref && (
                    <Link href={founderFeedbackHref} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--primary)] hover:text-[var(--clay)]">
                      {t("openSavedSession")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-[480px] lg:justify-end">
              {CALIBRATION_PROMPTS.map((prompt) => {
                const selected = calibrationScenario === prompt.scenario
                return (
                <button
                  key={prompt.scenario}
                  type="button"
                  onClick={() => applyCalibrationPrompt(prompt)}
                  className="rounded-full border px-3 py-1.5 text-[11px] font-medium transition hover:bg-[rgba(43,27,53,0.04)]"
                  style={{
                    borderColor: selected ? "rgba(184,137,90,0.42)" : "rgba(43,27,53,0.08)",
                    background: selected ? "rgba(184,137,90,0.1)" : "transparent",
                    color: selected ? "var(--primary)" : "var(--plum-soft)",
                  }}
                >
                  {selected ? t("selectedPrefix") : ""}
                  {t(`calibrationScenarios.${prompt.scenario}`)}
                </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {localizedThresholdPrompt && (
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
              {t("thresholdLabel", { month: localizedThresholdPrompt.month, day: localizedThresholdPrompt.day })}
            </p>
            <p className="text-[11px] font-light text-[var(--plum-soft)]">{localizedThresholdPrompt.theme}</p>
          </div>
          {localizedThresholdPrompt.quote && (
            <p className="mt-3 font-display text-[18px] font-light italic leading-relaxed text-[var(--primary)]">
              {localizedThresholdPrompt.quote}
            </p>
          )}
          <p className="mt-3 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
            {localizedThresholdPrompt.frameOfThought}
          </p>
          <p className="mt-4 font-display text-[17px] font-medium italic leading-relaxed text-[var(--primary)]">
            {localizedThresholdPrompt.socraticQuestion}
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
                {todayLabel}
              </span>
              <span className="text-[12px] font-light text-[var(--plum-soft)]">
                {wordCount} {wordCount === 1 ? t("wordOne") : t("wordOther")}
              </span>
            </div>

            {/* Writing area */}
            <div className="px-8 pt-6 pb-8">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("journalPlaceholder")}
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
                  {t("privacyNote")}
                </p>
                {voice.voiceEnabled && (
                  <MicButton onTranscribe={handleTranscribe} disabled={isSubmitting} />
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                className="inline-flex items-center gap-2 bg-[var(--primary)] text-[var(--cream)] text-[14px] font-medium px-6 py-2.5 rounded-full hover:bg-[var(--plum-mid)] transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                {isSubmitting ? t("reflecting") : t("reflect")}
              </button>
            </div>
            {text.trim().length > 0 && text.trim().length < 20 && (
              <p className="px-8 pb-4 text-[11px] font-light text-[var(--plum-soft)]/70">
                {t("addMoreContext")}
              </p>
            )}
            {founderOnlyHasPromptText && (
              <p className="px-8 pb-4 text-[11px] font-light text-[var(--plum-soft)]/70">
                {t("addRealContext")}
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

          {/* Guide header */}
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
                {t("guideResponse")}
              </p>
              <p className="text-[12px] font-light text-[var(--plum-soft)]">
                {result
                  ? t("stageLine", { name: guideStageNames[result.progression.newStage - 1], stage: result.progression.newStage })
                  : t("stageLine", { name: guideStageNames[avatarStage - 1], stage: avatarStage })}
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
                      {t("oneGroundedStep")}
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
                {t("emptyReflection")}
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
                {t("innerCouncil")}
              </p>
              <h2 className="font-display text-[22px] font-light text-[var(--primary)] leading-snug">
                {result.councilSession.observerSignal.coreTension ?? t("councilFallback")}
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
                        {message.abstained ? t("grounding") : signalLabel(message.confidence)}
                      </span>
                    </div>
                    <p className="text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
                      {message.abstained ? t("quietVoice") : message.content}
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
                    {t("supraconsciousGuide")}
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
                {t("sessionFeedback")}
              </p>
              <p className="text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
                {founderCalibrationMode
                  ? t("feedbackFounderHelp")
                  : t("feedbackStandardHelp")}
              </p>
              {founderCalibrationMode && (
                <p className="mt-2 text-[12px] font-light leading-relaxed text-[var(--clay)]">
                  {t("feedbackFounderNoteHelp")}
                </p>
              )}
              <textarea
                value={feedbackNote}
                onChange={(event) => setFeedbackNote(event.target.value)}
                maxLength={500}
                placeholder={founderCalibrationMode
                  ? t("feedbackFounderPlaceholder")
                  : t("feedbackStandardPlaceholder")}
                className="mt-4 w-full min-h-[86px] resize-none rounded-2xl border bg-transparent px-4 py-3 text-[13px] font-light leading-relaxed text-[var(--primary)] outline-none placeholder:text-[var(--plum-soft)]/45"
                style={{ borderColor: "rgba(43,27,53,0.08)" }}
              />
              {founderCalibrationMode && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {FOUNDER_FEEDBACK_NOTE_TEMPLATES.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => applyFeedbackTemplate(template)}
                      className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] transition hover:bg-[rgba(43,27,53,0.04)]"
                      style={{ borderColor: "rgba(43,27,53,0.08)" }}
                    >
                      {template.replace(": ", "")}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["helpful", feedbackT("helpful")],
                  ["not_accurate", feedbackT("not_accurate")],
                  ["too_intense", feedbackT("too_intense")],
                  ["unclear", feedbackT("unclear")],
                  ["unsupported_source", feedbackT("unsupported_source")],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={isSavingFeedback}
                    onClick={() => handleSessionFeedback(value)}
                    className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] transition hover:bg-[rgba(43,27,53,0.04)] disabled:opacity-40"
                    style={{ borderColor: "rgba(43,27,53,0.08)" }}
                  >
                    {feedbackSaved === value ? t("saved") : label}
                  </button>
                ))}
              </div>
              {feedbackSaved && (
                <div className="mt-3 rounded-2xl border px-4 py-3" style={{ borderColor: "rgba(184,137,90,0.18)", background: "rgba(184,137,90,0.07)" }}>
                  <p className="text-[11px] font-light leading-relaxed text-[var(--plum-soft)]/80">
                    {founderCalibrationMode
                      ? t("feedbackSavedFounder")
                      : t("feedbackSavedStandard")}
                  </p>
                  {founderCalibrationMode && result.journalEntry?.id && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/journal/${result.journalEntry.id}`}
                        className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--primary)] transition hover:bg-[rgba(43,27,53,0.04)]"
                        style={{ borderColor: "rgba(43,27,53,0.08)" }}
                      >
                        Open saved session
                      </Link>
                      <Link
                        href="/dashboard"
                        className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--primary)] transition hover:bg-[rgba(43,27,53,0.04)]"
                        style={{ borderColor: "rgba(43,27,53,0.08)" }}
                      >
                        {t("returnDashboard")}
                      </Link>
                    </div>
                  )}
                </div>
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
                {t("sourceGrounding")}
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
                          {t("matchedTerms", { terms: source.matchedTerms.slice(0, 4).join(", ") })}
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
                    {t("guideDeepened")}
                  </p>
                  <p className="font-display text-[22px] font-light text-[var(--cream)] leading-tight">
                    {t("guideBecoming", {
                      from: guideStageNames[result.progression.previousStage - 1],
                      to: guideStageNames[result.progression.newStage - 1],
                    }).split(guideStageNames[result.progression.newStage - 1])[0]}
                    <em className="italic text-[var(--clay-light)]">
                      {guideStageNames[result.progression.newStage - 1]}
                    </em>
                  </p>
                </div>
                <p className="text-[13px] font-light text-[var(--cream)]/50">
                  {t("stageLine", { name: "", stage: result.progression.newStage }).replace(" · ", "")}
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
                {t("reflectionDepth")}
              </p>
              <p className="font-display text-[16px] font-light text-[var(--primary)]">
                {t("enteringLevel", { level: LEVELS[result.progression.newLevel - 1] })}
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
                {t("generatedPrompt")}
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
                  {t("generatedPromptEmpty")}
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
                {t("embodimentGate")}
              </p>
              <h3 className="font-display text-[22px] font-light text-[var(--cream)] leading-tight">
                {t("embodimentQuestion")}
              </h3>
              <p className="mt-2 text-[13px] font-light text-[var(--cream)]/60">
                {t("embodimentHelp")}
              </p>
              <textarea
                value={embodimentText}
                onChange={(event) => {
                  setEmbodimentText(event.target.value)
                  setEmbodimentSaved(false)
                }}
                placeholder={t("embodimentPlaceholder")}
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
                {embodimentSaved ? t("gateCrossed") : t("crossGate")}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

type JournalTranslator = (key: string, values?: Record<string, string | number>) => string

function userFacingJournalError(error: unknown, status: number, t: JournalTranslator) {
  const message = typeof error === "string" ? error : ""
  if (status === 401) return t("journalErrorSignIn")
  if (status === 429) return t("journalErrorRate")
  if (status === 400 && message) return message
  if (status >= 500) return t("journalErrorServer")
  return t("transientError")
}

function userFacingSaveError(error: unknown, status: number, item: "shift" | "feedback", t: JournalTranslator) {
  const message = typeof error === "string" ? error : ""
  if (status === 401) return t("saveErrorSignIn")
  if (status === 404) return t("saveErrorMissing")
  if (status === 400 && message) return message
  return item === "shift"
    ? t("saveShiftError")
    : t("saveFeedbackError")
}

function normalizeStageNames(stageNames: readonly string[]) {
  return DEFAULT_STAGE_NAMES.map((fallback, index) => {
    const value = stageNames[index]
    return typeof value === "string" && value.trim() ? value.trim() : fallback
  })
}
