"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { BarChart3, BookOpen, CreditCard, FileWarning, Flag, HeartPulse, MessageSquareText, Network, Shield, Sparkles, Tags, Users } from "lucide-react"

const nav = [
  { href: "/", labelKey: "overview", icon: Shield },
  { href: "/users", labelKey: "users", icon: Users },
  { href: "/subscriptions", labelKey: "subscriptions", icon: CreditCard },
  { href: "/pricing", labelKey: "pricing", icon: Tags },
  { href: "/safety", labelKey: "safety", icon: FileWarning },
  { href: "/health", labelKey: "systemHealth", icon: HeartPulse },
  { href: "/pilot", labelKey: "pilotReadiness", icon: BarChart3 },
  { href: "/calibration", labelKey: "founderCalibration", icon: Sparkles },
  { href: "/prompts", labelKey: "prompts", icon: MessageSquareText },
  { href: "/sources", labelKey: "sources", icon: BookOpen },
  { href: "/reasoning-graph", labelKey: "reasoningGraph", icon: Network },
  { href: "/reasoning-ontology", labelKey: "reasoningOntology", icon: Network },
  { href: "/sources/readiness", labelKey: "ragReadiness", icon: Shield },
  { href: "/council", labelKey: "councilReview", icon: Sparkles },
  { href: "/guide-stages", labelKey: "guideStages", icon: BarChart3 },
  { href: "/feature-flags", labelKey: "featureFlags", icon: Flag },
  { href: "/ai-quality", labelKey: "aiQuality", icon: MessageSquareText },
] as const

export function AdminNavigation() {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const links = (
    <nav aria-label="Admin" className="grid gap-1 p-3">
      {nav.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex min-h-11 items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors focus-visible:outline-none"
            style={{
              borderColor: active ? "var(--primary)" : "transparent",
              background: active ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent",
              color: active ? "var(--foreground)" : "var(--muted-foreground)",
            }}
          >
            <item.icon aria-hidden="true" className="h-4 w-4" />
            {t(item.labelKey)}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      <details className="border-b md:hidden">
        <summary className="min-h-11 cursor-pointer px-5 py-3 text-sm font-medium text-foreground">{t("navigation")}</summary>
        {links}
      </details>
      <div className="hidden md:block">{links}</div>
    </>
  )
}
