import { AdminShell } from "@/components/admin-shell"
import { requireAdminUser } from "@inner-avatar/auth/session"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser()
  return <AdminShell>{children}</AdminShell>
}
