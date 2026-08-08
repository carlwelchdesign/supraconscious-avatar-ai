"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-3xl text-[var(--primary)]">Something went wrong</h1>
          <p className="text-sm text-[var(--plum-soft)]">Your entry was not shown here. You can safely try this page again.</p>
          <button type="button" onClick={reset} className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm text-[var(--cream)]">
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
