"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/providers/theme-provider"

export function AppProviders({
  children,
  clerkConfigured,
}: {
  children: React.ReactNode
  clerkConfigured: boolean
}) {
  const themed = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )

  if (!clerkConfigured) {
    return themed
  }

  return <ClerkProvider>{themed}</ClerkProvider>
}
