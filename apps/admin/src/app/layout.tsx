import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { MuiProvider } from "@/components/mui-provider"
import { AdminAutoLocalizer } from "@/components/admin-auto-localizer"
import { getAdminMessages } from "@/lib/admin-messages"
import { readAdminLanguage } from "@/lib/language"
import "./globals.css"

export const metadata: Metadata = {
  title: "Supraconscious Admin",
  description: "Internal administration for Supraconscious.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await readAdminLanguage()
  const messages = getAdminMessages(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <MuiProvider>
            <AdminAutoLocalizer />
            {children}
          </MuiProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
