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
          <h1 className="text-3xl font-semibold">This admin page didn’t open</h1>
          <p className="text-sm text-neutral-600">No private reflection content is displayed here. Try again, then check System Health if the problem continues.</p>
          <button type="button" onClick={reset} className="rounded-full bg-neutral-900 px-5 py-2 text-sm text-white">
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
