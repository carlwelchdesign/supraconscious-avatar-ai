import { prisma } from "@inner-avatar/db"
import { UsersTable } from "./users-table"

export default async function UsersPage() {
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
    <UsersTable
      users={users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        journalEntryCount: user._count.journalEntries,
        sessionCount: user._count.sessions,
      }))}
    />
  )
}
