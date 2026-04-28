"use client"

import { useState } from "react"
import { Loader2, ArrowRight } from "lucide-react"
import { AvatarOrb } from "@/components/ui/avatar-orb"

const AVATAR_STAGES = ["Echo", "Witness", "Clear Mirror", "Reframer", "Inner Author"] as const
const LEVELS = ["Awareness", "Pattern Recognition", "Honest Reflection", "Reframing", "Conscious Choice"] as const

type AnalysisResult = {
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
}

export function JournalWorkspace() {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)

  async function handleSubmit() {
    setError("")
    setResult(null)
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

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

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
          Write plainly. The reflection will stay short, structured, and non-clinical.
        </p>
      </div>

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
              <p className="text-[12px] font-light text-[var(--plum-soft)]/70">
                Private by default · Pattern memory adjustable in settings
              </p>
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
              background: result ? "var(--pearl)" : "var(--pearl)",
              borderColor: "rgba(43,27,53,0.07)",
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <AvatarOrb size="sm" />
              <div>
                <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--clay)]">
                  Avatar Response
                </p>
                <p className="text-[12px] font-light text-[var(--plum-soft)]">
                  {result
                    ? `${AVATAR_STAGES[result.progression.newStage - 1]} · Stage ${result.progression.newStage}`
                    : "Echo · Stage 1"}
                </p>
              </div>
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
              </div>
            ) : (
              <p className="font-display italic text-[15px] font-light text-[var(--plum-soft)]/60 leading-relaxed">
                Your reflection will appear here after you write and submit an entry.
              </p>
            )}
          </div>

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
                <AvatarOrb size="sm" className="mx-auto" />
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
        </aside>
      </div>
    </div>
  )
}
