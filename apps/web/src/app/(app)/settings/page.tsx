import { getCurrentSession, requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import {
  changePasswordAction,
  clearPatternMemoryAction,
  deleteAccountAction,
  revokeSessionAction,
  revokeSessionsAction,
  updateReflectionPreferences,
} from "./actions"
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

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ accountDelete?: string; password?: string }>
}) {
  const params = await searchParams
  const user = await requireAppUser()
  const currentSession = await getCurrentSession("web")
  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  })
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      scope: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
    },
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
            label="Remember recurring signals"
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
          <div className="pb-5">
            <button
              type="submit"
              formAction={clearPatternMemoryAction}
              className="rounded-full border px-4 py-2 text-[12px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)]"
              style={{ borderColor: "rgba(43,27,53,0.08)" }}
            >
              Clear remembered signals
            </button>
          </div>
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
        <form action={changePasswordAction} className="border-t px-6 py-5 space-y-4" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
          <div>
            <p className="text-[14px] font-medium text-[var(--primary)]">Change password</p>
            <p className="mt-0.5 text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
              Use this when you know your current password. If you are locked out, a super-admin can issue a temporary password from the admin users page.
            </p>
          </div>
          {params.password === "changed" ? (
            <p className="rounded-xl bg-[rgba(155,175,155,0.12)] px-4 py-3 text-[12px] font-medium text-[var(--sage)]">
              Password updated.
            </p>
          ) : null}
          {params.password === "incorrect" ? (
            <p className="rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              Current password is incorrect.
            </p>
          ) : null}
          {params.password === "invalid" ? (
            <p className="rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              Enter a new password with at least 8 characters and make sure both new-password fields match.
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-[12px] font-medium text-[var(--primary)]">
              Current password
              <input
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className="rounded-xl border bg-white px-3 py-2 text-[13px] font-light text-[var(--primary)] outline-none focus:border-[var(--clay)]"
                style={{ borderColor: "rgba(43,27,53,0.12)" }}
              />
            </label>
            <label className="grid gap-1 text-[12px] font-medium text-[var(--primary)]">
              New password
              <input
                name="newPassword"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                className="rounded-xl border bg-white px-3 py-2 text-[13px] font-light text-[var(--primary)] outline-none focus:border-[var(--clay)]"
                style={{ borderColor: "rgba(43,27,53,0.12)" }}
              />
            </label>
            <label className="grid gap-1 text-[12px] font-medium text-[var(--primary)]">
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                className="rounded-xl border bg-white px-3 py-2 text-[13px] font-light text-[var(--primary)] outline-none focus:border-[var(--clay)]"
                style={{ borderColor: "rgba(43,27,53,0.12)" }}
              />
            </label>
          </div>
          <button
            type="submit"
            className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)]"
          >
            Update password
          </button>
        </form>
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

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(43,27,53,0.07)",
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--plum-soft)]">
            Pilot data controls
          </p>
        </div>
        <div className="px-6">
          <SettingRow
            label="Export your data"
            description="Includes profile, entries, reflections, council sessions, pattern memory, feedback, safety events, consent records, and pilot event metadata."
            value={<a href="/api/account/export" className="font-medium text-[var(--clay)] hover:text-[var(--primary)]">Download JSON</a>}
          />
          <SettingRow
            label="Delete individual entries"
            description="Open any saved journal entry to delete that entry and its attached reflection records."
            value={<a href="/dashboard" className="font-medium text-[var(--clay)] hover:text-[var(--primary)]">Past entries</a>}
          />
          <SettingRow
            label="Revoke active sessions"
            description="Signs out this account across current app sessions."
            value={
              <form action={revokeSessionsAction}>
                <button type="submit" className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)]">
                  Revoke
                </button>
              </form>
            }
          />
        </div>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(43,27,53,0.07)",
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--plum-soft)]">
            Session management
          </p>
        </div>
        <div className="px-6">
          {sessions.length === 0 ? (
            <p className="py-5 text-[12px] font-light text-[var(--plum-soft)]">
              No active sessions were found.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(43,27,53,0.07)" }}>
              {sessions.map((session) => {
                const isCurrent = session.id === currentSession?.id

                return (
                  <div key={session.id} className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-[var(--primary)]">
                        {session.scope === "admin" ? "Admin session" : "Web session"}
                        {isCurrent ? " · current" : ""}
                      </p>
                      <p className="mt-0.5 text-[12px] font-light text-[var(--plum-soft)]">
                        Last seen {formatSettingsDate(session.lastSeenAt)} · Expires {formatSettingsDate(session.expiresAt)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-light text-[var(--plum-soft)]/70">
                        Created {formatSettingsDate(session.createdAt)}
                      </p>
                    </div>
                    <form action={revokeSessionAction}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <button
                        type="submit"
                        className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)]"
                        style={{ borderColor: "rgba(43,27,53,0.08)" }}
                      >
                        {isCurrent ? "Sign out here" : "Revoke"}
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "var(--pearl)",
          borderColor: "rgba(166,95,74,0.18)",
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(166,95,74,0.12)" }}>
          <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--clay)]">
            Delete account
          </p>
        </div>
        <form action={deleteAccountAction} className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[14px] font-medium text-[var(--primary)]">Delete this account and its private app data</p>
            <p className="mt-0.5 max-w-2xl text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
              This permanently removes your account, sessions, journal entries, reflections, council sessions, pattern memory, consent records, and subscriptions stored in this app. If Stripe billing is configured, linked Stripe subscriptions and customer records are cancelled/deleted first. Audit records may remain as detached operational records.
            </p>
          </div>
          {params.accountDelete === "incorrect" ? (
            <p className="rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              Password is incorrect.
            </p>
          ) : null}
          {params.accountDelete === "invalid" ? (
            <p className="rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              Enter your password and type DELETE to confirm account deletion.
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="grid gap-1 text-[12px] font-medium text-[var(--primary)]">
              Password
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="rounded-xl border bg-white px-3 py-2 text-[13px] font-light text-[var(--primary)] outline-none focus:border-[var(--clay)]"
                style={{ borderColor: "rgba(43,27,53,0.12)" }}
              />
            </label>
            <label className="grid gap-1 text-[12px] font-medium text-[var(--primary)]">
              Type DELETE
              <input
                name="confirmation"
                type="text"
                required
                autoComplete="off"
                className="rounded-xl border bg-white px-3 py-2 text-[13px] font-light text-[var(--primary)] outline-none focus:border-[var(--clay)]"
                style={{ borderColor: "rgba(43,27,53,0.12)" }}
              />
            </label>
            <button
              type="submit"
              className="rounded-full border border-[rgba(166,95,74,0.28)] px-5 py-2.5 text-[13px] font-medium text-[var(--clay)] hover:bg-[rgba(166,95,74,0.08)]"
            >
              Delete account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatSettingsDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
