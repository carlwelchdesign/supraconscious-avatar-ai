"use client"

import { NextIntlClientProvider } from "next-intl"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { MuiProvider } from "@/components/providers/mui-provider"

export function AppProviders({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode
  locale: string
  messages: Record<string, unknown>
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <MuiProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </MuiProvider>
    </NextIntlClientProvider>
  )
}
