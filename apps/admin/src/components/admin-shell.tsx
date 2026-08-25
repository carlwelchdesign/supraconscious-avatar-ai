import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { LogOut } from "lucide-react"
import { adminLogoutAction } from "@inner-avatar/auth/actions"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { AdminNavigation } from "./admin-navigation"

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations()
  const user = await getCurrentUser("admin")

  return (
    <div className="min-h-screen md:flex">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-foreground">Skip to content</a>
      <aside className="border-b bg-card/95 backdrop-blur-xl md:sticky md:top-0 md:h-screen md:w-72 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="border-b p-5">
          <Link href="/" className="text-lg font-semibold">{t("brand")}</Link>
          <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <AdminNavigation />
        <form action={adminLogoutAction} className="p-4">
          <button type="submit" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <LogOut className="h-4 w-4" />
            {t("signOut")}
          </button>
        </form>
      </aside>
      <main id="admin-content" className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  )
}
