"use client"

import Script from "next/script"

export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  if (!siteKey) return null

  return (
    <div className="flex justify-center">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </div>
  )
}
