import { prisma } from "@inner-avatar/db"
import { AiQualityTable } from "./ai-quality-table"

export default async function AiQualityPage() {
  const responses = await prisma.avatarResponse.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      patternName: true,
      createdAt: true,
      journalEntryId: true,
      user: { select: { email: true } },
    },
    take: 100,
  })

  return (
    <AiQualityTable
      responses={responses.map((response) => ({
        id: response.id,
        patternName: response.patternName,
        createdAt: response.createdAt.toISOString(),
        journalEntryId: response.journalEntryId,
        userEmail: response.user.email,
      }))}
    />
  )
}
