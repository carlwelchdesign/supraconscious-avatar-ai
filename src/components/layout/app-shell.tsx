import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { BookOpen, CircleUserRound, LayoutDashboard, Settings, Sparkles } from "lucide-react"
import { isClerkConfigured } from "@/lib/auth/config"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/patterns", label: "Patterns", icon: Sparkles },
  { href: "/avatar", label: "Avatar", icon: CircleUserRound },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const clerkConfigured = isClerkConfigured()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold tracking-normal">
            Inner Avatar
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            {clerkConfigured ? <UserButton /> : <div className="rounded-md border px-2 py-1 text-xs text-muted-foreground">Demo</div>}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
