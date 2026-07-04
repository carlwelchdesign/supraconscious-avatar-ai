import Link from "next/link"
import { BarChart3, BookOpen, CreditCard, FileWarning, Flag, HeartPulse, LogOut, MessageSquareText, Shield, Sparkles, Users } from "lucide-react"
import { adminLogoutAction } from "@inner-avatar/auth/actions"
import { getCurrentUser } from "@inner-avatar/auth/session"

const nav = [
  { href: "/", label: "Overview", icon: Shield },
  { href: "/users", label: "Users", icon: Users },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/safety", label: "Safety", icon: FileWarning },
  { href: "/health", label: "System Health", icon: HeartPulse },
  { href: "/pilot", label: "Pilot Readiness", icon: BarChart3 },
  { href: "/calibration", label: "Founder Calibration", icon: Sparkles },
  { href: "/prompts", label: "Prompts", icon: MessageSquareText },
  { href: "/sources", label: "Sources", icon: BookOpen },
  { href: "/sources/readiness", label: "RAG Readiness", icon: Shield },
  { href: "/council", label: "Council Review", icon: Sparkles },
  { href: "/avatar-stages", label: "Avatar Stages", icon: BarChart3 },
  { href: "/feature-flags", label: "Feature Flags", icon: Flag },
  { href: "/ai-quality", label: "AI Quality", icon: MessageSquareText },
]

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser("admin")

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b bg-card md:sticky md:top-0 md:h-screen md:w-72 md:border-b-0 md:border-r">
        <div className="border-b p-5">
          <Link href="/" className="text-lg font-semibold">Inner Avatar Admin</Link>
          <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <nav className="grid gap-1 p-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={adminLogoutAction} className="p-4">
          <button type="submit" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  )
}
