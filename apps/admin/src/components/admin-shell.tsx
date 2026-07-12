import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { BarChart3, BookOpen, CreditCard, FileWarning, Flag, HeartPulse, LogOut, MessageSquareText, Shield, Sparkles, Users } from "lucide-react"
import { adminLogoutAction } from "@inner-avatar/auth/actions"
import { getCurrentUser } from "@inner-avatar/auth/session"

const nav = [
  { href: "/", labelKey: "overview", icon: Shield },
  { href: "/users", labelKey: "users", icon: Users },
  { href: "/subscriptions", labelKey: "subscriptions", icon: CreditCard },
  { href: "/safety", labelKey: "safety", icon: FileWarning },
  { href: "/health", labelKey: "systemHealth", icon: HeartPulse },
  { href: "/pilot", labelKey: "pilotReadiness", icon: BarChart3 },
  { href: "/calibration", labelKey: "founderCalibration", icon: Sparkles },
  { href: "/prompts", labelKey: "prompts", icon: MessageSquareText },
  { href: "/sources", labelKey: "sources", icon: BookOpen },
  { href: "/sources/readiness", labelKey: "ragReadiness", icon: Shield },
  { href: "/council", labelKey: "councilReview", icon: Sparkles },
  { href: "/guide-stages", labelKey: "guideStages", icon: BarChart3 },
  { href: "/feature-flags", labelKey: "featureFlags", icon: Flag },
  { href: "/ai-quality", labelKey: "aiQuality", icon: MessageSquareText },
]

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations()
  const navT = await getTranslations("nav")
  const user = await getCurrentUser("admin")

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b bg-card md:sticky md:top-0 md:h-screen md:w-72 md:border-b-0 md:border-r">
        <div className="border-b p-5">
          <Link href="/" className="text-lg font-semibold">{t("brand")}</Link>
          <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <nav className="grid gap-1 p-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <item.icon className="h-4 w-4" />
              {navT(item.labelKey)}
            </Link>
          ))}
        </nav>
        <form action={adminLogoutAction} className="p-4">
          <button type="submit" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  )
}
