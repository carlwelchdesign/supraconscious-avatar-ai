type AdminStatusTone = "success" | "warning" | "error"

export type AdminStatusMessage = {
  tone: AdminStatusTone
  message: string
}

export function AdminStatusBanner({ message }: { message?: AdminStatusMessage | null }) {
  if (!message) return null

  return (
    <div
      className={[
        "rounded-md border p-3 text-sm",
        message.tone === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700" : "",
        message.tone === "warning" ? "border-amber-500/20 bg-amber-500/5 text-amber-700" : "",
        message.tone === "error" ? "border-destructive/20 bg-destructive/5 text-destructive" : "",
      ].filter(Boolean).join(" ")}
      role={message.tone === "error" ? "alert" : "status"}
    >
      {message.message}
    </div>
  )
}

export function InlineActionHelp({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      {children}
    </p>
  )
}
import type { ReactNode } from "react"
