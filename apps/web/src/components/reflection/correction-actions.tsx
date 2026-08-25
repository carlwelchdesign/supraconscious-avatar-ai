"use client"

import { useState } from "react"
import { Check, Loader2, RotateCcw, X } from "lucide-react"
import type { PublicDimension } from "@/lib/dimension-rationale"

type Correction = { id: string; correctionType: string; dimension: string | null }
type State = "idle" | "saving" | "saved" | "restoring" | "error"

export function CorrectionActions({ reflectionSessionId, dimension, initialCorrections, labels }: {
  reflectionSessionId: string
  dimension?: PublicDimension
  initialCorrections: Correction[]
  labels: { keep: string; correct: string; reject: string; restore: string; saved: string; restored: string; error: string }
}) {
  const [corrections, setCorrections] = useState(initialCorrections)
  const [state, setState] = useState<State>("idle")
  const active = corrections.at(-1) ?? null

  async function save(correctionType: "prefer" | "suppress" | "stop") {
    if (state === "saving" || state === "restoring") return
    setState("saving")
    try {
      const response = await fetch("/api/reflections/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflectionSessionId, dimension, correctionType }),
      })
      if (!response.ok) throw new Error("correction_failed")
      const payload = await response.json()
      setCorrections((current) => [...current, payload.correction])
      setState("saved")
    } catch {
      setState("error")
    }
  }

  async function restore() {
    if (!active || state === "saving" || state === "restoring") return
    setState("restoring")
    try {
      const response = await fetch("/api/reflections/corrections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctionId: active.id }),
      })
      if (!response.ok) throw new Error("restore_failed")
      setCorrections((current) => current.filter((correction) => correction.id !== active.id))
      setState("idle")
    } catch {
      setState("error")
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" aria-label={dimension ? `${dimension} correction actions` : "Reflection correction actions"}>
        {active ? (
          <button type="button" onClick={restore} disabled={state === "restoring"} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
            {state === "restoring" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <RotateCcw aria-hidden="true" className="h-4 w-4" />}
            {labels.restore}
          </button>
        ) : dimension ? (
          <button type="button" onClick={() => save("suppress")} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
            <X aria-hidden="true" className="h-4 w-4" /> {labels.correct}
          </button>
        ) : (
          <>
            <button type="button" onClick={() => save("prefer")} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
              <Check aria-hidden="true" className="h-4 w-4" /> {labels.keep}
            </button>
            <button type="button" onClick={() => save("stop")} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
              <X aria-hidden="true" className="h-4 w-4" /> {labels.reject}
            </button>
          </>
        )}
      </div>
      <p className="mt-2 min-h-5 text-xs text-[var(--text-secondary)]" role="status" aria-live="polite">
        {state === "saving" ? labels.saved.replace(".", "…") : state === "saved" ? labels.saved : state === "error" ? labels.error : !active && initialCorrections.length > 0 ? labels.restored : ""}
      </p>
    </div>
  )
}
