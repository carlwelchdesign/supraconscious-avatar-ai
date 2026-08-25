import Link from "next/link"
import { LogOut } from "lucide-react"
import { logoutAction } from "@inner-avatar/auth/actions"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { DesktopNavigation } from "@/components/layout/desktop-navigation"
import { resolveWebLanguage } from "@/lib/language"
import { getWebMessages } from "@/lib/web-messages"

const navItems = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/journal", labelKey: "journal" },
  { href: "/patterns", labelKey: "patterns" },
  { href: "/guide", labelKey: "guide" },
  { href: "/settings", labelKey: "settings" },
] as const

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const currentLanguage = await resolveWebLanguage(user?.preferredLanguage)
  const messages = getWebMessages(currentLanguage)
  const shell = messages.appShell

  const localizedNavItems = navItems.map((item) => ({
    href: item.href,
    label: shell.nav[item.labelKey],
  }))

  return (
    <div className="member-app">
      <header className="member-shell-header sticky top-0 z-40">
        <div className="mx-auto flex min-h-16 w-full max-w-[92rem] items-center justify-between gap-4 px-5 md:px-8 lg:px-12">
          <Link
            href="/dashboard"
            className="font-display text-xl font-medium tracking-[0.12em] text-[var(--text-primary)] md:text-[22px]"
          >
            Supraconscious
          </Link>

          <DesktopNavigation items={localizedNavItems} />

          <div className="flex min-w-11 items-center justify-end md:min-w-[11rem]">
            {user ? <span className="mr-3 hidden max-w-32 truncate text-xs text-[var(--text-secondary)] lg:inline">{user.email}</span> : null}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] md:min-w-0 md:px-3"
                title={shell.signOut}
                aria-label={shell.signOut}
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                <span className="hidden text-sm md:inline">{shell.signOut}</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <MobileBottomNav />

      <main className="min-w-0">
        <div className="member-shell-content">{children}</div>
      </main>
    </div>
  )
}
