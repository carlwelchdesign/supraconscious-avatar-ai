"use client"

import { useActionState } from "react"
import { Button } from "@inner-avatar/ui/button"
import { Input } from "@inner-avatar/ui/input"
import { revealFlaggedEntryAction, type RevealState } from "./actions"

export function RevealEntryForm({ safetyEventId }: { safetyEventId: string }) {
  const [state, formAction, isPending] = useActionState<RevealState, FormData>(
    revealFlaggedEntryAction,
    {},
  )

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="safetyEventId" value={safetyEventId} />
      <Input name="reason" placeholder="Reason for reveal, e.g. user support ticket..." required minLength={10} />
      <Button type="submit" disabled={isPending} variant="outline">
        {isPending ? "Revealing..." : "Reveal raw entry"}
      </Button>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.rawText ? (
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm leading-6">
          {state.rawText}
        </pre>
      ) : null}
    </form>
  )
}
