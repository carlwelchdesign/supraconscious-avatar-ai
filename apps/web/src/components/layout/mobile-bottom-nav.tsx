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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t"
      style={{
        background: "rgba(244,237,228,0.96)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(43,27,53,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 relative flex flex-col items-center justify-center gap-1 py-3 transition-colors"
            style={{ color: active ? "var(--clay)" : "var(--plum-soft)" }}
          >
            <item.icon
              className="w-[22px] h-[22px] transition-all"
              strokeWidth={active ? 1.75 : 1.5}
            />
            <span
              className="text-[10px] font-medium tracking-[0.04em]"
              style={{ opacity: active ? 1 : 0.6 }}
            >
              {t(item.labelKey)}
            </span>
            {active && (
              <span
                className="absolute bottom-0 w-5 h-0.5 rounded-t-full"
                style={{ background: "var(--clay)" }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
