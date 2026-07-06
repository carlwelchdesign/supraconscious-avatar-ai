"use client"

import { useState } from "react"
import { FOUNDER_FEEDBACK_NOTE_TEMPLATES } from "@inner-avatar/ai/founder-feedback-notes"
import {
  readInitialSavedSessionFeedbackType,
  SAVED_SESSION_FEEDBACK_TYPES,
  type SavedSessionFeedbackType,
} from "@/lib/saved-session-feedback"

type FeedbackAction = (formData: FormData) => void | Promise<void>

type Props = {
  action: FeedbackAction
  councilSessionId: string
  founderCalibrationMode: boolean
}

export function SavedSessionFeedbackForm({ action, councilSessionId, founderCalibrationMode }: Props) {
  const [note, setNote] = useState("")
  const [feedbackType, setFeedbackType] = useState<SavedSessionFeedbackType | "">(
    readInitialSavedSessionFeedbackType(founderCalibrationMode),
  )
  const canSubmit = Boolean(feedbackType)

  const applyTemplate = (template: string) => {
    setNote((current) => (current.trim() ? `${current.trim()}\n${template}` : template))
  }

  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="councilSessionId" value={councilSessionId} />
      <input type="hidden" name="feedbackType" value={feedbackType} />
      <div className="flex flex-wrap gap-2">
        {SAVED_SESSION_FEEDBACK_TYPES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={feedbackType === value}
            onClick={() => setFeedbackType(value)}
            className="rounded-full border px-3 py-1.5 text-[11px] font-medium transition hover:bg-[rgba(43,27,53,0.04)]"
            style={{
              borderColor: feedbackType === value ? "rgba(184,137,90,0.42)" : "rgba(43,27,53,0.08)",
              background: feedbackType === value ? "rgba(184,137,90,0.1)" : "transparent",
              color: feedbackType === value ? "var(--primary)" : "var(--plum-soft)",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        name="note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
        placeholder={founderCalibrationMode
          ? "Optional note: what felt right, wrong, unsupported, or unlike Maria's phrasing."
          : "Optional note: what felt helpful, inaccurate, too intense, unclear, or unsupported."}
        className="w-full min-h-[86px] resize-none rounded-xl border bg-transparent px-3 py-2 text-[12px] font-light leading-relaxed text-[var(--primary)] outline-none placeholder:text-[var(--plum-soft)]/45"
        style={{ borderColor: "rgba(43,27,53,0.08)" }}
      />
      {founderCalibrationMode && (
        <>
          <div className="flex flex-wrap gap-2">
            {FOUNDER_FEEDBACK_NOTE_TEMPLATES.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => applyTemplate(template)}
                className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] transition hover:bg-[rgba(43,27,53,0.04)]"
                style={{ borderColor: "rgba(43,27,53,0.08)" }}
              >
                {template.replace(": ", "")}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-light leading-relaxed text-[var(--plum-soft)]/70">
            Choose a feedback type to keep calibration moving. Add a note only when there is a specific detail to capture; it stays with the session and does not automatically retrain the guide.
          </p>
          {!feedbackType && (
            <p className="text-[11px] font-light leading-relaxed text-[var(--clay)]">
              Choose one feedback type before saving this calibration pass.
            </p>
          )}
        </>
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ borderColor: "rgba(43,27,53,0.08)" }}
      >
        Save feedback
      </button>
    </form>
  )
}
