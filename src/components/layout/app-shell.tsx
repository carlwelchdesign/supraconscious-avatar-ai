import Link from "next/link"
import { BookOpen, CircleUserRound, LayoutDashboard, LogOut, Settings, Shield, Sparkles } from "lucide-react"
import { logoutAction } from "@/lib/auth/actions"
import { getCurrentUser } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/patterns", label: "Patterns", icon: Sparkles },
  { href: "/avatar", label: "Avatar", icon: CircleUserRound },
  { href: "/settings", label: "Settings", icon: Settings },
]

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

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
              {user?.role === "admin" ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              ) : null}
            </nav>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
