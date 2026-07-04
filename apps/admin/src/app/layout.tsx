import type { Metadata } from "next"
import { MuiProvider } from "@/components/mui-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Inner Avatar Admin",
  description: "Internal administration for Inner Avatar.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ isolation: "isolate" }} suppressHydrationWarning>
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  )
}
