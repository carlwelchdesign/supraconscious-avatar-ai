import { prisma } from "@inner-avatar/db"
import { UsersTable } from "./users-table"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { journalEntries: true, sessions: true } },
    },
    take: 100,
  })

  return (
    <UsersTable
      status={status}
      users={users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
        journalEntryCount: user._count.journalEntries,
        sessionCount: user._count.sessions,
      }))}
    />
  )
}
