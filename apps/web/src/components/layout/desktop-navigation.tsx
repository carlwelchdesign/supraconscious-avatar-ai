"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavigationItem = {
  href: string
  label: string
}

export function DesktopNavigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary" className="hidden items-stretch md:flex">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="relative flex min-h-16 items-center px-4 text-[13px] font-medium uppercase tracking-[0.09em] transition-colors"
            style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
          >
            {item.label}
            {active ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-4 bottom-0 h-0.5 rounded-t-full"
                style={{ background: "var(--action-primary)" }}
              />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
