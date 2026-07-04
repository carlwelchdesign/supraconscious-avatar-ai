"use client"

import { useEffect } from "react"

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script"
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js"

export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  useTurnstileScript(Boolean(siteKey))

  if (!siteKey) return null

  return (
    <div className="flex justify-center">
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </div>
  )
}

function useTurnstileScript(enabled: boolean) {
  useEffect(() => {
    if (!enabled || document.getElementById(TURNSTILE_SCRIPT_ID)) return

    const script = document.createElement("script")
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [enabled])
}
