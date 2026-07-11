"use client"

import { useState } from "react"

type DeleteAction = (formData: FormData) => void | Promise<void>

type Props = {
  action: DeleteAction
  journalEntryId: string
  labels: {
    first: string
    armed: string
    helperFirst: string
    helperArmed: string
  }
}

export function DeleteJournalEntryForm({ action, journalEntryId, labels }: Props) {
  const [armed, setArmed] = useState(false)

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="journalEntryId" value={journalEntryId} />
      <button
        type={armed ? "submit" : "button"}
        onClick={() => {
          if (!armed) setArmed(true)
        }}
        className="rounded-full border px-4 py-2 text-[12px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)]"
        style={{ borderColor: "rgba(43,27,53,0.08)" }}
      >
        {armed ? labels.armed : labels.first}
      </button>
      <p className="text-[11px] font-light leading-relaxed text-[var(--plum-soft)]/70">
        {armed ? labels.helperArmed : labels.helperFirst}
      </p>
    </form>
  )
}
