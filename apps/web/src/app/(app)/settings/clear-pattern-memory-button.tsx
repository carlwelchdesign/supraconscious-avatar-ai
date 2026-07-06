"use client"

import { useState } from "react"
import { readPatternMemoryClearButtonLabel, readPatternMemoryClearHelperText } from "@/lib/pattern-memory-clear-confirmation"

type Props = {
  action: (formData: FormData) => void | Promise<void>
}

export function ClearPatternMemoryButton({ action }: Props) {
  const [armed, setArmed] = useState(false)

  return (
    <div className="space-y-2">
      <button
        type={armed ? "submit" : "button"}
        formAction={armed ? action : undefined}
        onClick={() => {
          if (!armed) setArmed(true)
        }}
        className="rounded-full border px-4 py-2 text-[12px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)]"
        style={{ borderColor: "rgba(43,27,53,0.08)" }}
      >
        {readPatternMemoryClearButtonLabel(armed)}
      </button>
      <p className="max-w-xl text-[11px] font-light leading-relaxed text-[var(--plum-soft)]/70">
        {readPatternMemoryClearHelperText(armed)}
      </p>
    </div>
  )
}
