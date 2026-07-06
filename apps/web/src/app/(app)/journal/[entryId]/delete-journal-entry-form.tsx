"use client"

import { useState } from "react"
import { readJournalDeleteButtonLabel, readJournalDeleteHelperText } from "@/lib/journal-delete-confirmation"

type DeleteAction = (formData: FormData) => void | Promise<void>

type Props = {
  action: DeleteAction
  journalEntryId: string
}

export function DeleteJournalEntryForm({ action, journalEntryId }: Props) {
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
        {readJournalDeleteButtonLabel(armed)}
      </button>
      <p className="text-[11px] font-light leading-relaxed text-[var(--plum-soft)]/70">
        {readJournalDeleteHelperText(armed)}
      </p>
    </form>
  )
}
