"use client"

import { useState } from "react"
import { FOUNDER_FEEDBACK_NOTE_TEMPLATES } from "@inner-avatar/ai/founder-feedback-notes"

type FeedbackAction = (formData: FormData) => void | Promise<void>

type Props = {
  action: FeedbackAction
  councilSessionId: string
  founderCalibrationMode: boolean
}

const FEEDBACK_TYPES = [
  ["helpful", "Helpful"],
  ["not_accurate", "Not accurate"],
  ["too_intense", "Too intense"],
  ["unclear", "Unclear"],
  ["unsupported_source", "Report source issue"],
] as const

export function SavedSessionFeedbackForm({ action, councilSessionId, founderCalibrationMode }: Props) {
  const [note, setNote] = useState("")

  const applyTemplate = (template: string) => {
    setNote((current) => (current.trim() ? `${current.trim()}\n${template}` : template))
  }

  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="councilSessionId" value={councilSessionId} />
      <select name="feedbackType" defaultValue="helpful" className="w-full rounded-xl border bg-transparent px-3 py-2 text-[12px] text-[var(--plum-soft)]" style={{ borderColor: "rgba(43,27,53,0.08)" }}>
        {FEEDBACK_TYPES.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
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
        </>
      )}
      <button
        className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)] disabled:opacity-40"
        style={{ borderColor: "rgba(43,27,53,0.08)" }}
      >
        Save feedback
      </button>
    </form>
  )
}
