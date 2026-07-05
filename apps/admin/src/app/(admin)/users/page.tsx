import { prisma } from "@inner-avatar/db"
import { UsersTable } from "./users-table"

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const [users, founderParticipants] = await Promise.all([
    prisma.user.findMany({
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
    }),
    readFounderParticipantsForUsers(),
  ])
  const founderByUserId = new Map(
    founderParticipants
      .filter((participant) => participant.userId)
      .map((participant) => [participant.userId, participant]),
  )
  const founderByEmail = new Map(founderParticipants.map((participant) => [participant.email, participant]))

  return (
    <UsersTable
      status={status}
      users={users.map((user) => {
        const founderParticipant = founderByUserId.get(user.id) ?? founderByEmail.get(user.email.toLowerCase())

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
          journalEntryCount: user._count.journalEntries,
          sessionCount: user._count.sessions,
          founderParticipantRole: founderParticipant?.participantRole ?? null,
          founderParticipantStatus: founderParticipant?.status ?? null,
        }
      })}
    />
  )
}

async function readFounderParticipantsForUsers() {
  try {
    return await prisma.founderCalibrationParticipant.findMany({
      select: {
        email: true,
        userId: true,
        participantRole: true,
        status: true,
      },
    })
  } catch {
    return []
  }
}
