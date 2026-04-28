import { requireAppUser } from "@/lib/auth/user"

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
            Your entries are never used to train models, shared with third parties, or stored beyond your account. You own everything you write.
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
        <div className="px-6">
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
            description="Allows your Avatar to notice recurring themes across entries."
            value={<StatusPill on={user.patternMemoryEnabled ?? true} />}
          />
          <SettingRow
            label="Safety mode"
            description="High-intensity or crisis entries receive grounded support instead of symbolic prompts."
            value={<StatusPill on={user.safetyModeEnabled ?? true} />}
          />
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

      <p className="text-[12px] font-light text-[var(--plum-soft)]/50 leading-relaxed">
        Billing, data export, and account deletion controls will appear here as the product expands.
      </p>
    </div>
  )
}
