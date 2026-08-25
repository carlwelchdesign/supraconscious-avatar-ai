"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"

type SavedAction = { id: string; text: string }

export function MemberActionEditor({ councilSessionId, initialActions, labels }: {
  councilSessionId: string
  initialActions: SavedAction[]
  labels: { question: string; help: string; placeholder: string; save: string; saved: string; error: string }
}) {
  const [text, setText] = useState(initialActions.at(-1)?.text ?? "")
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle")

  async function save() {
    if (text.trim().length < 3 || state === "saving") return
    setState("saving")
    try {
      const response = await fetch("/api/council/embodiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ councilSessionId, text }),
      })
      if (!response.ok) throw new Error("action_save_failed")
      await response.json()
      const savedText = text.trim()
      setText(savedText)
      setState("saved")
    } catch {
      setState("error")
    }
  }

  return (
    <div>
      <p className="font-display text-xl text-[var(--text-primary)]">{labels.question}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{labels.help}</p>
      <textarea value={text} onChange={(event) => { setText(event.target.value); setState("idle") }} maxLength={1000} placeholder={labels.placeholder} className="mt-4 min-h-24 w-full resize-y rounded-xl border border-[var(--border-active)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={text.trim().length < 3 || state === "saving"} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--action-primary)] px-5 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-40">
          {state === "saving" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" className="h-4 w-4" />}
          {labels.save}
        </button>
        <p className="text-xs text-[var(--text-secondary)]" role="status" aria-live="polite">{state === "saved" ? labels.saved : state === "error" ? labels.error : ""}</p>
      </div>
    </div>
  )
}
