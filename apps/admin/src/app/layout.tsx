import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { MuiProvider } from "@/components/mui-provider"
import { getAdminIntlMessages } from "@/lib/admin-messages"
import "./globals.css"

export const metadata: Metadata = {
  title: "Supraconscious Admin",
  description: "Internal administration for Supraconscious.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = "en"
  const messages = getAdminIntlMessages(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <MuiProvider>
            {children}
          </MuiProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
