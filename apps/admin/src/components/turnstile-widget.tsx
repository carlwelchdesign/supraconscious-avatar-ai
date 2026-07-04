"use client"

import Script from "next/script"
import { Box } from "@mui/material"

export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  if (!siteKey) return null

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </Box>
  )
}
