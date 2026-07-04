"use client"

import { useState } from "react"

export function CopyHandoffButton({ text, label = "Copy handoff" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleCopy() {
    setFailed(false)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setFailed(true)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-muted"
      >
        {copied ? "Copied" : label}
      </button>
      {failed ? (
        <span className="text-xs text-muted-foreground">
          Select the text and copy it manually.
        </span>
      ) : null}
    </div>
  )
}
