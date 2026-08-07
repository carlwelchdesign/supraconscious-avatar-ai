import { DOCTRINE_CONTRACT, DIMENSION_CONTRACT } from "@inner-avatar/ai"
import { requireJournalAccessPageUser } from "@/lib/journal-access"

export async function GuidePageContent() {
  const user = await requireJournalAccessPageUser("/guide")

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--clay)]">
          Constant Guide · your awareness develops
        </p>
        <h1 className="font-display text-[40px] font-light leading-tight text-[var(--primary)]">
          Meet your <em className="font-normal italic text-[var(--clay)]">Supraconscious Guide.</em>
        </h1>
        <p className="mt-3 max-w-xl text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
          The Guide does not level up or become a different persona. It stays consistent while your capacity to notice, choose, and embody grows over time.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border p-10" style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
        <span className="pointer-events-none absolute right-12 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full opacity-15 blur-[80px]" style={{ background: "radial-gradient(circle, var(--clay), transparent)" }} />
        <div className="relative z-10">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--clay-light)]">Your constant Guide</p>
          <h2 className="mb-3 font-display text-[36px] font-light leading-tight text-[var(--cream)]">{DOCTRINE_CONTRACT.guide.name}</h2>
          <p className="max-w-sm text-[15px] font-light leading-[1.7] text-[var(--cream)]/60">
            Its language remains tentative and grounded. It may offer different dimensions as your reflection calls for them, without claiming to know your truth.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <GuideTrait label="Tone" value={user.avatarTone ?? "Gentle"} />
            <GuideTrait label="Intensity" value={`${user.intensityLevel ?? 1}/5`} />
            <GuideTrait label="Progression" value="Yours, not the Guide's" />
          </div>
        </div>
      </div>

      <section>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--plum-soft)]">{DOCTRINE_CONTRACT.frameworkName}</p>
        <p className="mb-6 max-w-2xl text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
          These are equal facets of consciousness, not a fixed sequence or a ladder. A session may surface only the dimensions that fit the moment.
        </p>
        <div className="space-y-3">
          {DOCTRINE_CONTRACT.dimensions.map((dimension) => {
            const detail = DIMENSION_CONTRACT[dimension]
            return (
              <div key={dimension} className="flex items-start gap-4 rounded-2xl border p-5" style={{ background: "var(--pearl)", borderColor: "rgba(43,27,53,0.07)" }}>
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--clay)]" />
                <div>
                  <h3 className="font-display text-[18px] font-medium capitalize text-[var(--primary)]">{dimension}</h3>
                  <p className="mt-1 text-[13px] font-medium text-[var(--plum-soft)]">{detail.question}</p>
                  <p className="mt-1 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]/80">{detail.distinction}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function GuideTrait({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full px-4 py-1.5 text-[12px] font-light" style={{ background: "rgba(244,237,228,0.08)", color: "rgba(244,237,228,0.65)" }}>
      <span className="mr-1.5 font-medium text-[rgba(244,237,228,0.4)]">{label}</span>
      {value}
    </div>
  )
}
