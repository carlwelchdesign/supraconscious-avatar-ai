import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"
import { AvatarOrb } from "@/components/ui/avatar-orb"

export default async function JournalEntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const user = await requireAppUser()
  const { entryId } = await params
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: user.id },
    include: { analysis: true, avatarResponse: true, generatedPrompts: true },
  })

  if (!entry) notFound()

  const date = new Date(entry.createdAt)
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const r = entry.avatarResponse

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[13px] font-light text-[var(--plum-soft)] hover:text-[var(--primary)] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to dashboard
      </Link>

      {/* Date header */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1.5">
          Journal entry
        </p>
        <h1 className="font-display text-[32px] font-light leading-tight text-[var(--primary)]">
          {dateLabel}
        </h1>
      </div>

      {/* Entry text */}
      <div
        className="rounded-2xl border p-7"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(43,27,53,0.07)",
        }}
      >
        <p
          className="font-display text-[17px] font-light leading-[1.85] text-[var(--primary)] whitespace-pre-wrap journal-lines"
          style={{ paddingBottom: "1rem" }}
        >
          {entry.rawText}
        </p>
      </div>

      {/* Avatar reflection */}
      {r ? (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "var(--primary)",
            borderColor: "var(--primary)",
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center px-7 pt-7 pb-5">
            <AvatarOrb size="sm" stage={(user.avatarStage ?? 1) as 1|2|3|4|5} className="mb-3" />
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay-light)] mb-0.5">
              Avatar reflection
            </p>
            <p className="font-display text-[18px] font-light text-[var(--cream)]">
              Echo · Stage {user.avatarStage ?? 1}
            </p>
          </div>

          <div
            className="mx-7 mb-1"
            style={{ height: "1px", background: "rgba(255,255,255,0.08)" }}
          />

          <div className="px-7 py-6 space-y-5">
            {r.openingLine && (
              <p className="text-[14px] font-light leading-[1.7] text-[var(--cream)]/70">
                {r.openingLine}
              </p>
            )}

            {r.mirror && (
              <p className="font-display italic text-[18px] font-light leading-[1.75] text-[var(--cream)]">
                &ldquo;{r.mirror}&rdquo;
              </p>
            )}

            {r.patternName && (
              <span
                className="inline-block text-[11px] font-medium px-3 py-1 rounded-full"
                style={{
                  background: "rgba(184,137,90,0.18)",
                  color: "var(--clay-light)",
                }}
              >
                {r.patternName}
              </span>
            )}

            {r.socraticQuestion && (
              <div
                className="rounded-xl px-5 py-4 border-l-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderLeftColor: "var(--clay)",
                }}
              >
                <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-[var(--clay-light)] mb-2">
                  Reflect on this
                </p>
                <p className="font-display italic text-[16px] font-light leading-[1.7] text-[var(--cream)]/80">
                  {r.socraticQuestion}
                </p>
              </div>
            )}

            {r.integrationStep && (
              <div
                className="rounded-xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <p className="text-[13px] font-medium tracking-[0.06em] uppercase text-[var(--clay-light)] mb-2">
                  An integration step
                </p>
                <p className="text-[14px] font-light leading-[1.7] text-[var(--cream)]/75">
                  {r.integrationStep}
                </p>
              </div>
            )}

            {r.closingLine && (
              <p className="text-[13px] font-light italic text-[var(--cream)]/50 pt-1">
                {r.closingLine}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl border border-dashed p-8 text-center"
          style={{ borderColor: "rgba(43,27,53,0.12)" }}
        >
          <p className="font-display text-[18px] font-light text-[var(--plum-soft)]">
            No reflection was generated for this entry.
          </p>
        </div>
      )}
    </div>
  )
}
