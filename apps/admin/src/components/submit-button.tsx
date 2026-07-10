"use client"

import type { ReactNode } from "react"
import { useFormStatus } from "react-dom"

type SubmitButtonProps = {
  children: ReactNode
  pendingLabel?: string
  className?: string
  disabled?: boolean
}

const DEFAULT_CLASS = "w-fit rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  className = DEFAULT_CLASS,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  )
}
