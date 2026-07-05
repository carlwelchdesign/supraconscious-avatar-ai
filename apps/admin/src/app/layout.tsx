import type { Metadata } from "next"
import { MuiProvider } from "@/components/mui-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Supraconscious Admin",
  description: "Internal administration for Supraconscious.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  )
}
