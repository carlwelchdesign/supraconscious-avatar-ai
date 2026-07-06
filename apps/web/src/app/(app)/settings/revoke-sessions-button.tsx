"use client"

import { useState } from "react"
import { readSessionRevokeAllButtonLabel, readSessionRevokeAllHelperText } from "@/lib/session-revoke-confirmation"

type Props = {
  action: (formData: FormData) => void | Promise<void>
}

export function RevokeSessionsButton({ action }: Props) {
  const [armed, setArmed] = useState(false)

  return (
    <div className="space-y-2 text-right">
      <button
        type={armed ? "submit" : "button"}
        formAction={armed ? action : undefined}
        onClick={() => {
          if (!armed) setArmed(true)
        }}
        className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)]"
        style={{ borderColor: "rgba(43,27,53,0.08)" }}
      >
        {readSessionRevokeAllButtonLabel(armed)}
      </button>
      <p className="max-w-56 text-[11px] font-light leading-relaxed text-[var(--plum-soft)]/70">
        {readSessionRevokeAllHelperText(armed)}
      </p>
    </div>
  )
}
