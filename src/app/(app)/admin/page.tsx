import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdminUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

const adminLinks = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/prompts", label: "Prompt Management" },
]

export default async function AdminPage() {
  await requireAdminUser()
  const [users, entries, subscriptions] = await Promise.all([
    prisma.user.count(),
    prisma.journalEntry.count(),
    prisma.subscription.count(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage accounts, billing, analytics, and prompt operations.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Users" value={users} />
        <Metric title="Journal Entries" value={entries} />
        <Metric title="Subscriptions" value={subscriptions} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {adminLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle>{item.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Open {item.label.toLowerCase()}.</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  )
}
