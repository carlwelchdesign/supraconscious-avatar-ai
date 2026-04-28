import { requireAppUser } from "@/lib/auth/user"
import { AvatarOrb } from "@/components/ui/avatar-orb"

const stages = [
  {
    name: "Echo",
    description: "Reflects your language back with care. Mirrors tone and recurring words without interpretation.",
    trait: "Listening",
  },
  {
    name: "Witness",
    description: "Begins naming what it observes. Notices emotional signals and language patterns.",
    trait: "Noticing",
  },
  {
    name: "Clear Mirror",
    description: "Names contradictions gently. Helps you see the gap between what you say and what you feel.",
    trait: "Clarity",
  },
  {
    name: "Reframer",
    description: "Offers alternative perspectives on recurring stories. Not prescriptive — expansive.",
    trait: "Perspective",
  },
  {
    name: "Inner Author",
    description: "Supports you in writing new narratives. The deepest stage of integration.",
    trait: "Authorship",
  },
]

export default async function AvatarPage() {
  const user = await requireAppUser()
  const stageIndex = (user.avatarStage ?? 1) - 1
  const currentStage = stages[stageIndex] ?? stages[0]

  return (
    <div className="space-y-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1.5">
          Your Avatar
        </p>
        <h1 className="font-display text-[40px] font-light text-[var(--primary)] leading-tight">
          An inner presence,
          <br />
          <em className="italic font-normal text-[var(--clay)]">not a chatbot.</em>
        </h1>
        <p className="mt-3 text-[14px] font-light leading-relaxed text-[var(--plum-soft)] max-w-xl">
          The Avatar adapts through evidence of reflection, not intensity. Each stage is earned gradually — through the accumulated depth of your writing.
        </p>
      </div>

      {/* ── Current stage hero ─────────────────────────────────── */}
      <div
        className="rounded-3xl border p-10 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden"
        style={{
          background: "var(--primary)",
          borderColor: "var(--primary)",
        }}
      >
        <span
          className="absolute top-1/2 right-12 -translate-y-1/2 w-72 h-72 rounded-full blur-[80px] opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--clay), transparent)" }}
        />
        <AvatarOrb size="lg" stage={(user.avatarStage ?? 1) as 1|2|3|4|5} className="flex-shrink-0 relative z-10" />
        <div className="relative z-10 text-center sm:text-left">
          <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--clay-light)] mb-2">
            Current stage · {user.avatarStage ?? 1} of 5
          </p>
          <h2 className="font-display text-[36px] font-light text-[var(--cream)] mb-3 leading-tight">
            {currentStage.name}
          </h2>
          <p className="text-[15px] font-light leading-[1.7] text-[var(--cream)]/60 max-w-sm">
            {currentStage.description}
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              { label: "Tone", value: user.avatarTone ?? "Gentle" },
              { label: "Intensity", value: `${user.intensityLevel ?? 1}/5` },
              { label: "Trait", value: currentStage.trait },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-full px-4 py-1.5 text-[12px] font-light"
                style={{
                  background: "rgba(244,237,228,0.08)",
                  color: "rgba(244,237,228,0.65)",
                }}
              >
                <span className="font-medium" style={{ color: "rgba(244,237,228,0.4)", marginRight: "6px" }}>{label}</span>
                {value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Evolution timeline ──────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--plum-soft)] mb-6">
          The five stages
        </p>
        <div className="space-y-3">
          {stages.map((stage, i) => {
            const isPast = i < stageIndex
            const isCurrent = i === stageIndex
            const isFuture = i > stageIndex

            return (
              <div
                key={stage.name}
                className="rounded-2xl border p-5 flex items-start gap-4 transition-all"
                style={{
                  background: isCurrent ? "var(--pearl)" : "transparent",
                  borderColor: isCurrent
                    ? "rgba(184,137,90,0.25)"
                    : "rgba(43,27,53,0.07)",
                  opacity: isFuture ? 0.5 : 1,
                }}
              >
                <AvatarOrb
                  size="xs"
                  stage={(i + 1) as 1|2|3|4|5}
                  className="flex-shrink-0 mt-0.5"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3
                      className="font-display text-[18px] font-medium"
                      style={{ color: isCurrent ? "var(--primary)" : "var(--plum-soft)" }}
                    >
                      {stage.name}
                    </h3>
                    {isCurrent && (
                      <span
                        className="text-[10px] font-medium tracking-[0.1em] uppercase px-2.5 py-0.5 rounded-full"
                        style={{ background: "rgba(184,137,90,0.1)", color: "var(--clay)" }}
                      >
                        Current
                      </span>
                    )}
                    {isPast && (
                      <span
                        className="text-[10px] font-medium tracking-[0.1em] uppercase px-2.5 py-0.5 rounded-full"
                        style={{ background: "rgba(155,175,155,0.12)", color: "var(--sage)" }}
                      >
                        Complete
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[13px] font-light leading-relaxed"
                    style={{ color: isCurrent ? "var(--plum-soft)" : "rgba(122,107,138,0.7)" }}
                  >
                    {stage.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
