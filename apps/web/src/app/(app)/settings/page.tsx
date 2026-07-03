import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { updateReflectionPreferences } from "./actions"
import { VoiceSettingsSection } from "@/components/voice/VoiceSettingsSection"

function SettingRow({
  label,
  description,
  value,
}: {
  label: string
  description?: string
  value: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-6 py-5 border-b last:border-0"
      style={{ borderColor: "rgba(43,27,53,0.07)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[var(--primary)]">{label}</p>
        {description && (
          <p className="text-[12px] font-light text-[var(--plum-soft)] mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 text-[13px] font-light text-[var(--plum-soft)]">
        {value}
      </div>
    </div>
  )
}

function StatusPill({ on }: { on: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full"
      style={
        on
          ? { background: "rgba(155,175,155,0.12)", color: "var(--sage)" }
          : { background: "rgba(43,27,53,0.06)", color: "var(--plum-soft)" }
      }
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: on ? "var(--sage)" : "var(--plum-soft)" }}
      />
      {on ? "On" : "Off"}
    </span>
  )
}

export default async function SettingsPage() {
  const user = await requireAppUser()
  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="space-y-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1.5">
          Settings
        </p>
        <h1 className="font-display text-[40px] font-light text-[var(--primary)] leading-tight">
          Your privacy & preferences
        </h1>
        <p className="mt-3 text-[14px] font-light leading-relaxed text-[var(--plum-soft)] max-w-xl">
          Your journal is private by default. These controls let you shape how your Avatar works.
        </p>
      </div>

      {/* ── Privacy notice ─────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5 flex items-start gap-3"
        style={{
          background: "rgba(155,175,155,0.07)",
          borderColor: "rgba(155,175,155,0.2)",
        }}
      >
        <span className="text-[var(--sage)] text-[18px] flex-shrink-0 mt-0.5">✦</span>
        <div>
          <p className="text-[13px] font-medium text-[var(--primary)] mb-0.5">
            Private by default
          </p>
          <p className="text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
            Your entries are used only to generate your reflections, safety checks, voice transcription, and speech playback. AI providers may process the text or audio needed for those features; raw journal text stays protected in this app.
          </p>
        </div>
      </div>

      {/* ── Reflection preferences ─────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(43,27,53,0.07)",
        }}
      >
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: "rgba(43,27,53,0.06)" }}
        >
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--plum-soft)]">
            Reflection preferences
          </p>
        </div>
        <form action={updateReflectionPreferences} className="px-6">
          <SettingRow
            label="Avatar tone"
            description="How your Avatar speaks to you during reflections."
            value={
              <span className="font-medium text-[var(--primary)]">
                {user.avatarTone ?? "Gentle"}
              </span>
            }
          />
          <SettingRow
            label="Reflection intensity"
            description="How deeply your Avatar engages with each entry."
            value={
              <span className="font-medium text-[var(--primary)]">
                {user.intensityLevel ?? 1} / 5
              </span>
            }
          />
          <SettingRow
            label="Pattern memory"
            description="Stores recurring signals and short evidence excerpts unless you turn it off."
            value={
              <input
                name="patternMemoryEnabled"
                type="checkbox"
                defaultChecked={user.patternMemoryEnabled ?? true}
                className="h-5 w-5 accent-[var(--clay)]"
                aria-label="Enable pattern memory"
              />
            }
          />
          <SettingRow
            label="Safety mode"
            description="Crisis and high-risk entries always receive grounded support. This cannot be disabled."
            value={<StatusPill on />}
          />
          <div className="py-5">
            <button
              type="submit"
              className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)]"
            >
              Save reflection preferences
            </button>
          </div>
        </form>
      </div>

      {/* ── Billing ───────────────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(43,27,53,0.07)",
        }}
      >
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: "rgba(43,27,53,0.06)" }}
        >
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--plum-soft)]">
            Billing
          </p>
        </div>
        <div className="px-6">
          <SettingRow
            label="Plan"
            description="Your current Inner Avatar subscription plan."
            value={
              <span className="font-medium text-[var(--primary)]">
                {subscription?.plan ?? "free"}
              </span>
            }
          />
          <SettingRow
            label="Subscription status"
            description="Managed securely through Stripe."
            value={<StatusPill on={subscription?.status === "active"} />}
          />
          <div className="py-5">
            {subscription?.stripeCustomerId ? (
              <form action="/api/billing/portal" method="post">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)]"
                >
                  Manage billing
                </button>
              </form>
            ) : (
              <a
                href="/pricing"
                className="inline-flex rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)]"
              >
                Choose a plan
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Account ────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(43,27,53,0.07)",
        }}
      >
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: "rgba(43,27,53,0.06)" }}
        >
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--plum-soft)]">
            Account
          </p>
        </div>
        <div className="px-6">
          <SettingRow
            label="Email"
            description="Your account email address."
            value={user.email}
          />
          <SettingRow
            label="Name"
            value={user.name ?? "—"}
          />
          <SettingRow
            label="Avatar stage"
            description="Your current stage of reflection depth."
            value={
              <span className="font-medium text-[var(--primary)]">
                Stage {user.avatarStage ?? 1}
              </span>
            }
          />
        </div>
      </div>

      {/* ── Voice & Audio ───────────────────────────────────────── */}
      <VoiceSettingsSection
        initial={{
          voiceEnabled: user.voiceEnabled ?? false,
          voiceAutoPlay: user.voiceAutoPlay ?? false,
          voiceInputDefault: (user.voiceInputDefault ?? "text") as "text" | "voice" | "ask",
          voiceGender: (user.voiceGender ?? "female") as "female" | "male",
          voiceStyle: (user.voiceStyle ?? "warm") as "warm" | "neutral" | "deep" | "soft",
          voiceSpeed: user.voiceSpeed ?? 1.0,
        }}
      />

      <p className="text-[12px] font-light text-[var(--plum-soft)]/50 leading-relaxed">
        Data export and account deletion controls will appear here as the product expands.
      </p>
    </div>
  )
}
