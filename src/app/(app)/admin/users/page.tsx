import { Card, CardContent } from "@/components/ui/card"
import { requireAdminUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export default async function AdminUsersPage() {
  await requireAdminUser()
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { journalEntries: true, sessions: true } },
    },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">Users</h1>
      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm">
              <div>
                <p className="font-medium">{user.name || user.email}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-muted-foreground">{user.role}</div>
              <div className="text-muted-foreground">{user._count.journalEntries} entries</div>
              <div className="text-muted-foreground">{user.createdAt.toLocaleDateString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
