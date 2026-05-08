"use client"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { MuiProvider } from "@/components/providers/mui-provider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MuiProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </MuiProvider>
  )
}
