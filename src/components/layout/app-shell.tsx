import Link from "next/link"
import { BookOpen, BarChart2, Sparkles, Settings, LogOut, LayoutDashboard, Shield } from "lucide-react"
import { logoutAction } from "@/lib/auth/actions"
import { getCurrentUser } from "@/lib/auth/session"
import { AvatarOrb } from "@/components/ui/avatar-orb"

const AVATAR_STAGE_NAMES = ["Echo", "Witness", "Clear Mirror", "Reframer", "Inner Author"]

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/patterns", label: "Patterns", icon: BarChart2 },
  { href: "/avatar", label: "Avatar", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
]

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[220px] flex-shrink-0 sticky top-0 h-screen border-r"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(43,27,53,0.08)",
        }}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b" style={{ borderColor: "rgba(43,27,53,0.07)" }}>
          <Link href="/dashboard" className="font-display text-lg font-medium text-[var(--primary)] tracking-wide">
            Inner Avatar
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-light text-[var(--plum-soft)] hover:text-[var(--primary)] hover:bg-[var(--plum-pale)] transition-all"
            >
              <item.icon className="w-[15px] h-[15px] flex-shrink-0 opacity-70" />
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-light text-[var(--plum-soft)] hover:text-[var(--primary)] hover:bg-[var(--plum-pale)] transition-all"
            >
              <Shield className="w-[15px] h-[15px] flex-shrink-0 opacity-70" />
              Admin
            </Link>
          )}
        </nav>

        {/* Avatar presence + user */}
        <div className="px-5 pb-5 pt-4 border-t" style={{ borderColor: "rgba(43,27,53,0.07)" }}>
          <div className="flex flex-col items-center text-center mb-4">
            <AvatarOrb size="xs" stage={(user?.avatarStage ?? 1) as 1|2|3|4|5} className="mb-2" />
            <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-[var(--clay)] leading-none mb-0.5">
              Your Avatar
            </p>
            <p className="text-[12px] font-light text-[var(--plum-soft)]">
              {AVATAR_STAGE_NAMES[(user?.avatarStage ?? 1) - 1]} · Stage {user?.avatarStage ?? 1}
            </p>
          </div>

          {user && (
            <div className="pt-3 border-t" style={{ borderColor: "rgba(43,27,53,0.07)" }}>
              <p className="text-[11px] font-light text-[var(--plum-soft)] truncate mb-2">
                {user.email}
              </p>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-[11px] font-light text-[var(--plum-soft)] hover:text-[var(--primary)] transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 border-b"
        style={{
          background: "rgba(244,237,228,0.92)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(43,27,53,0.08)",
        }}
      >
        <span className="font-display text-lg font-medium text-[var(--primary)]">
          Inner Avatar
        </span>
        <div className="flex items-center gap-3">
          {navItems.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-1.5 text-[var(--plum-soft)] hover:text-[var(--primary)] transition-colors"
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
          <form action={logoutAction}>
            <button type="submit" className="p-1.5 text-[var(--plum-soft)] hover:text-[var(--primary)] transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="flex-1 min-w-0 md:pt-0 pt-16">
        <div className="max-w-4xl mx-auto px-6 py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
