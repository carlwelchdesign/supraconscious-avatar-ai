"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { BookOpen, BarChart2, Sparkles, Settings, LayoutDashboard } from "lucide-react"

const navItems = [
  { href: "/dashboard", labelKey: "home", icon: LayoutDashboard },
  { href: "/journal", labelKey: "journal", icon: BookOpen },
  { href: "/patterns", labelKey: "patterns", icon: BarChart2 },
  { href: "/guide", labelKey: "guide", icon: Sparkles },
  { href: "/settings", labelKey: "settings", icon: Settings },
]

export function MobileBottomNav() {
  const t = useTranslations("appShell.nav")
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t md:hidden"
      style={{
        background: "color-mix(in srgb, var(--canvas) 92%, transparent)",
        backdropFilter: "blur(20px)",
        borderColor: "var(--border-subtle)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors"
            style={{ color: active ? "var(--action-primary)" : "var(--text-secondary)" }}
          >
            <item.icon
              aria-hidden="true"
              className="w-[22px] h-[22px] transition-all"
              strokeWidth={active ? 1.75 : 1.5}
            />
            <span
              className="text-[11px] font-medium tracking-[0.04em]"
              style={{ opacity: active ? 1 : 0.6 }}
            >
              {t(item.labelKey)}
            </span>
            {active && (
              <span
                className="absolute bottom-0 w-5 h-0.5 rounded-t-full"
                style={{ background: "var(--action-primary)" }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
