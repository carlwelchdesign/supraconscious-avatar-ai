"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Loader2, ArrowRight, Check, CloudOff, RotateCcw, ShieldCheck } from "lucide-react"
import {
  FOUNDER_CALIBRATION_SCENARIO_PROMPTS,
  type FounderCalibrationScenario,
} from "@inner-avatar/ai/founder-calibration-scenarios"
import { MicButton } from "@/components/voice/MicButton"
import { AudioPlayer } from "@/components/voice/AudioPlayer"
import { MirrorFormingState } from "@/components/journal/mirror-forming-state"
import { DimensionRationalePanel } from "@/components/journal/dimension-rationale-panel"
import type { PublicDimensionRationale } from "@/lib/dimension-rationale"
import { resolveFounderCalibrationSubmissionScenario } from "@/lib/founder-calibration-submit"
import { buildSpeakText } from "@/lib/voice/voice-config"
import { LivingField } from "@/components/ambient/living-field"
import { resolveLivingFieldState, shouldAutosaveDraft, type DraftSaveState } from "@/lib/journal-composer-state"

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
  dimensionRationale: PublicDimensionRationale | null
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
  voicePrefs?: VoicePrefs
  thresholdPrompt?: ThresholdPrompt
  todayLabel?: string
  founderCalibrationMode?: boolean
  suggestedCalibrationScenario?: Exclude<FounderCalibrationScenario, "freeform">
  needsFounderFirstSessionGuide?: boolean
  needsFounderFeedback?: boolean
  founderFeedbackHref?: string | null
  responseLanguageLabel: string
  patternMemoryEnabled: boolean
}

export function JournalWorkspace({
  voicePrefs,
  thresholdPrompt = null,
  todayLabel = "",
  founderCalibrationMode = false,
  suggestedCalibrationScenario,
  needsFounderFirstSessionGuide = false,
  needsFounderFeedback = false,
  founderFeedbackHref = null,
  responseLanguageLabel,
  patternMemoryEnabled,
}: Props) {
  const t = useTranslations("journal")
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
  const [error, setError] = useState("")
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const [calibrationScenario, setCalibrationScenario] = useState<FounderCalibrationScenario>(suggestedCalibrationScenario ?? "freeform")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [gentlerHandling, setGentlerHandling] = useState(false)
  const [motionEnabled, setMotionEnabled] = useState(true)
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine)
  const [draftState, setDraftState] = useState<DraftSaveState>("empty")
  const [draftId, setDraftId] = useState<string | null>(null)
  const submissionInFlight = useRef(false)
  const lastSavedText = useRef("")

  const voice = voicePrefs ?? {
    voiceEnabled: false,
    voiceAutoPlay: false,
    voiceGender: "female",
    voiceStyle: "warm",
    voiceSpeed: 1.0,
  }

  async function handleSubmit() {
    if (submissionInFlight.current) return
    submissionInFlight.current = true
    setError("")
    setErrorStatus(null)
    setResult(null)
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
        body: JSON.stringify({
          text,
          calibrationScenario: submittedCalibrationScenario,
          handlingPreference: gentlerHandling ? "gentler" : "standard",
        }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setErrorStatus(response.status)
        setError(userFacingJournalError(payload.error, response.status, t))
        return
      }
      setResult(payload)
      setDraftState("saved")
      if (draftId) {
        void fetch("/api/journal/draft", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draftId }),
        })
        setDraftId(null)
      }
    } catch {
      setErrorStatus(0)
      setError(t("transientError"))
    } finally {
      submissionInFlight.current = false
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const online = () => setIsOnline(true)
    const offline = () => {
      setIsOnline(false)
      setDraftState((current) => current === "empty" ? current : "offline")
    }
    window.addEventListener("online", online)
    window.addEventListener("offline", offline)
    return () => {
      window.removeEventListener("online", online)
      window.removeEventListener("offline", offline)
    }
  }, [])

  useEffect(() => {
    if (!text.trim()) return
    if (text === lastSavedText.current) return
    if (!shouldAutosaveDraft({ text, isSubmitting, isOnline })) return

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setDraftState("saving")
      try {
        const response = await fetch("/api/journal/draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: draftId ?? undefined, text }),
          signal: controller.signal,
        })
        if (!response.ok) throw new Error("draft_save_failed")
        const payload = await response.json()
        setDraftId(payload.journalEntry.id)
        lastSavedText.current = text
        setDraftState("saved")
      } catch (saveError) {
        if ((saveError as Error).name !== "AbortError") setDraftState(navigator.onLine ? "error" : "offline")
      }
    }, 900)
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [draftId, isOnline, isSubmitting, text])

  const handleTranscribe = (transcribed: string) => {
    setDraftState(isOnline ? "dirty" : "offline")
    setText((prev) => (prev.trim() ? `${prev}\n${transcribed}` : transcribed))
  }

  const applyCalibrationPrompt = (prompt: (typeof CALIBRATION_PROMPTS)[number]) => {
    setDraftState(isOnline ? "dirty" : "offline")
    setCalibrationScenario(prompt.scenario)
    const promptText = prompt.text
    setText((prev) => {
      const trimmed = prev.trim()
      if (!trimmed || CALIBRATION_PROMPT_TEXTS.has(trimmed)) return promptText
      return `${prev}\n\n${promptText}`
    })
  }
  const trimmedText = text.trim()
  const founderFirstSessionNeedsContext = founderCalibrationMode && needsFounderFirstSessionGuide && !result
  const founderOnlyHasPromptText = founderFirstSessionNeedsContext && CALIBRATION_PROMPT_TEXTS.has(trimmedText)
  const canSubmit = trimmedText.length >= 20 && !founderOnlyHasPromptText
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0
  const fieldState = resolveLivingFieldState({
    hasText: Boolean(trimmedText),
    isFocused,
    isSubmitting,
    safetySeverity: result?.safety.severity,
  })
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
  return (
    <div className="relative isolate overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--canvas)] px-4 py-6 sm:px-6 lg:px-8">
      <LivingField state={fieldState} motionEnabled={motionEnabled} className="absolute inset-0 z-0 h-full w-full opacity-90" />
      <div className="relative z-10 space-y-6">

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
                  disabled={isSubmitting}
                  className="rounded-full border px-3 py-1.5 text-[11px] font-medium transition hover:bg-[rgba(43,27,53,0.04)] disabled:cursor-not-allowed disabled:opacity-40"
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

      <section className="grid gap-px overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2 xl:grid-cols-4" aria-label={t("composerPreferences")}>
        <div className="bg-[var(--surface)] px-4 py-3">
          <p className="observatory-label">{t("responseLanguage")}</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">{responseLanguageLabel}</p>
          <Link href="/settings" className="mt-1 inline-block text-xs text-[var(--action-primary)] underline-offset-4 hover:underline">{t("changeInSettings")}</Link>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-3 bg-[var(--surface)] px-4 py-3">
          <span><span className="observatory-label block">{t("gentlerHandling")}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">{t("gentlerHandlingHelp")}</span></span>
          <input type="checkbox" checked={gentlerHandling} onChange={(event) => setGentlerHandling(event.target.checked)} className="h-5 w-5 accent-[var(--action-primary)]" />
        </label>
        <div className="bg-[var(--surface)] px-4 py-3">
          <p className="observatory-label">{t("patternMemory")}</p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">{patternMemoryEnabled ? t("on") : t("off")}</p>
          <Link href="/settings" className="mt-1 inline-block text-xs text-[var(--action-primary)] underline-offset-4 hover:underline">{t("reviewPrivacyControl")}</Link>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-3 bg-[var(--surface)] px-4 py-3">
          <span><span className="observatory-label block">{t("livingField")}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">{t("livingFieldHelp")}</span></span>
          <input type="checkbox" checked={motionEnabled} onChange={(event) => setMotionEnabled(event.target.checked)} className="h-5 w-5 accent-[var(--action-primary)]" />
        </label>
      </section>

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
                onChange={(e) => {
                  setText(e.target.value)
                  setDraftState(e.target.value.trim() ? (isOnline ? "dirty" : "offline") : "empty")
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                readOnly={isSubmitting}
                aria-busy={isSubmitting}
                placeholder={t("journalPlaceholder")}
                className="w-full min-h-[340px] resize-none bg-transparent outline-none font-display text-[18px] font-light leading-[1.95] text-[var(--primary)] placeholder:text-[var(--primary)]/20 journal-lines read-only:cursor-default read-only:opacity-75"
                style={{ caretColor: "var(--clay)" }}
              />
            </div>

            {/* Editor footer */}
            <div
              className="flex items-center justify-between px-8 py-4 border-t"
              style={{ borderColor: "rgba(43,27,53,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[12px] font-light text-[var(--text-secondary)]" role="status" aria-live="polite">
                  {draftState === "saving" && <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />}
                  {draftState === "saved" && <Check aria-hidden="true" className="h-3.5 w-3.5 text-[var(--signal-success)]" />}
                  {draftState === "offline" && <CloudOff aria-hidden="true" className="h-3.5 w-3.5" />}
                  {draftState === "empty" && <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />}
                  <span>{t(`draftStates.${draftState}`)}</span>
                </div>
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
                  <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin motion-reduce:animate-none" />
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{error}</span>
                {errorStatus !== 401 && errorStatus !== 403 && (
                  <button type="button" onClick={handleSubmit} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-current px-4 py-2 font-medium">
                    <RotateCcw aria-hidden="true" className="h-4 w-4" /> {t("retry")}
                  </button>
                )}
              </div>
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
            {isSubmitting ? null : (
              <div className="flex flex-col items-center text-center mb-5">
                <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)]">
                  {t("guideResponse")}
                </p>
                <p className="text-[12px] font-light text-[var(--plum-soft)]">Supraconscious Guide · constant presence</p>
              </div>
            )}

            {isSubmitting ? (
              <MirrorFormingState
                status={t("mirrorFormingStatus")}
                supportingText={t("mirrorFormingSupport")}
              />
            ) : result ? (
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

          {result?.dimensionRationale && (
            <DimensionRationalePanel rationale={result.dimensionRationale} />
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

        </aside>
      </div>
      </div>
    </div>
  )
}

type JournalTranslator = (key: string, values?: Record<string, string | number>) => string

function userFacingJournalError(error: unknown, status: number, t: JournalTranslator) {
  const message = typeof error === "string" ? error : ""
  if (status === 401) return t("journalErrorSignIn")
  if (status === 403) return t("journalErrorPermission")
  if (status === 429) return t("journalErrorRate")
  if (status === 400 && message) return message
  if (status >= 500) return t("journalErrorServer")
  return t("transientError")
}
