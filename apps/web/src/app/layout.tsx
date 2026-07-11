import type { Metadata } from "next"
import { Cormorant_Garamond, DM_Sans } from "next/font/google"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { getWebLocale, getWebMessages } from "@/lib/web-messages"
import { readRequestLanguage } from "@/lib/language"
import { AppProviders } from "@/components/providers/app-providers"
import "./globals.css"

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://supraconscious.co"
const title = "Supraconscious Inner Council — Write. See clearly. Choose consciously."
const description =
  "A guided AI journaling system where a bounded Inner Council helps surface patterns, contradictions, source-grounded context, and one embodied next step."
const openGraphImage = "/opengraph-image.png"
const twitterImage = "/twitter-image.png"

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title,
  description,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title,
    description,
    url: appUrl,
    siteName: "The Inner Council",
    images: [
      {
        url: openGraphImage,
        width: 1200,
        height: 630,
        alt: "The Inner Council cosmic eye artwork",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [twitterImage],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const locale = getWebLocale(user?.preferredLanguage ?? await readRequestLanguage())
  const messages = getWebMessages(locale)

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Grain overlay as real element — iOS Safari ignores pointer-events:none on fixed pseudo-elements */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
            opacity: 0.026,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            mixBlendMode: "multiply",
          }}
        />
        <AppProviders locale={locale} messages={messages}>{children}</AppProviders>
      </body>
    </html>
  )
}
