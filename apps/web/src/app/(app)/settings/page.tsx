import { getCurrentSession, requireAppUser } from "@inner-avatar/auth/session"
import { listPasskeys } from "@inner-avatar/auth/webauthn"
import { isStripeConfigured } from "@inner-avatar/billing"
import { prisma } from "@inner-avatar/db"
import { formatWebDateTime } from "@/lib/date-format"
import { resolveWebLanguage, supportedLanguageOptions } from "@/lib/language"
import { getWebMessages } from "@/lib/web-messages"
import { VoiceSettingsSection } from "@/components/voice/VoiceSettingsSection"
import { PasskeySettings } from "@/components/auth/passkey-settings"
import { ClearPatternMemoryButton } from "./clear-pattern-memory-button"
import { RevokeSessionsButton } from "./revoke-sessions-button"
import {
  changePasswordAction,
  clearPatternMemoryAction,
  deleteAccountAction,
  revokeSessionAction,
  revokeSessionsAction,
  updateLanguagePreference,
  updateReflectionPreferences,
} from "./actions"

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

function StatusPill({ on, labels }: { on: boolean; labels: { on: string; off: string } }) {
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
      {on ? labels.on : labels.off}
    </span>
  )
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ accountDelete?: string; billing?: string; checkout?: string; password?: string; session?: string }>
}) {
  const [params, user] = await Promise.all([searchParams, requireAppUser()])
  const currentLanguage = await resolveWebLanguage(user.preferredLanguage)
  const messages = getWebMessages(currentLanguage)
  const settingsMessages = messages.settings
  const commonMessages = messages.common
  const statusLabels = { on: commonMessages.on, off: commonMessages.off }
  const billingEnabled = isStripeConfigured()
  const guideStage = Math.min(Math.max(user.avatarStage ?? 1, 1), 5)
  const [currentSession, subscription, sessions, passkeys] = await Promise.all([
    getCurrentSession("web"),
    prisma.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true,
        scope: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
      },
    }),
    listPasskeys(user.id),
  ])

  return (
    <div className="space-y-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--clay)] mb-1.5">
          {settingsMessages.eyebrow}
        </p>
        <h1 className="font-display text-[40px] font-light text-[var(--primary)] leading-tight">
          {settingsMessages.title}
        </h1>
        <p className="mt-3 text-[14px] font-light leading-relaxed text-[var(--plum-soft)] max-w-xl">
          {settingsMessages.body}
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
            {settingsMessages.privacyTitle}
          </p>
          <p className="text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
            {settingsMessages.privacyDescription}
          </p>
        </div>
      </div>

      {/* ── Language preferences ─────────────────────────────── */}
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
            {settingsMessages.languageSection}
          </p>
        </div>
        <form action={updateLanguagePreference} className="px-6">
          <SettingRow
            label={settingsMessages.languageLabel}
            description={settingsMessages.languageDescription}
            value={
              <select
                name="preferredLanguage"
                defaultValue={currentLanguage}
                className="rounded-lg border bg-white px-3 py-2 text-[13px] text-[var(--primary)]"
                style={{ borderColor: "rgba(43,27,53,0.12)" }}
                aria-label="Language preference"
              >
                {supportedLanguageOptions().map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeLabel}
                  </option>
                ))}
              </select>
            }
          />
          <div className="py-5">
            <button
              type="submit"
              className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)]"
            >
              {commonMessages.saveLanguage}
            </button>
          </div>
        </form>
        <div className="border-t" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
          <PasskeySettings
            initialPasskeys={passkeys.map((passkey) => ({
              ...passkey,
              createdAt: passkey.createdAt.toISOString(),
              lastUsedAt: passkey.lastUsedAt?.toISOString() ?? null,
            }))}
          />
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
            {settingsMessages.reflectionSection}
          </p>
        </div>
        <form action={updateReflectionPreferences} className="px-6">
          <SettingRow
            label={settingsMessages.guideTone}
            description={settingsMessages.guideToneDescription}
            value={
              <span className="font-medium text-[var(--primary)]">
                {user.avatarTone ?? "Gentle"}
              </span>
            }
          />
          <SettingRow
            label={settingsMessages.reflectionIntensity}
            description={settingsMessages.reflectionIntensityDescription}
            value={
              <span className="font-medium text-[var(--primary)]">
                {user.intensityLevel ?? 1} / 5
              </span>
            }
          />
          <SettingRow
            label={settingsMessages.patternMemoryLabel}
            description={settingsMessages.patternMemoryDescription}
            value={
              <input
                name="patternMemoryEnabled"
                type="checkbox"
                defaultChecked={user.patternMemoryEnabled === true}
                className="h-5 w-5 accent-[var(--clay)]"
                aria-label={settingsMessages.patternMemoryLabel}
              />
            }
          />
          <div className="pb-5">
            <ClearPatternMemoryButton action={clearPatternMemoryAction} />
          </div>
          <SettingRow
            label={settingsMessages.safetyMode}
            description={settingsMessages.safetyModeDescription}
            value={<StatusPill on labels={statusLabels} />}
          />
          <div className="py-5">
            <button
              type="submit"
              className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)]"
            >
              {settingsMessages.saveReflectionPreferences}
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
            {settingsMessages.billingSection}
          </p>
        </div>
        <div className="px-6">
          {params.checkout === "success" ? (
            <p className="mt-5 rounded-xl bg-[rgba(155,175,155,0.12)] px-4 py-3 text-[12px] font-medium text-[var(--sage)]">
              {settingsMessages.checkoutSuccess}
            </p>
          ) : null}
          {params.billing === "unavailable" ? (
            <p className="mt-5 rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              {settingsMessages.billingUnavailable}
            </p>
          ) : null}
          {!billingEnabled ? (
            <p className="mt-5 rounded-xl bg-[rgba(184,137,90,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              {settingsMessages.billingDisabled}
            </p>
          ) : null}
          <SettingRow
            label={settingsMessages.plan}
            description={settingsMessages.planDescription}
            value={
              <span className="font-medium text-[var(--primary)]">
                {subscription?.plan ?? settingsMessages.freePlan}
              </span>
            }
          />
          <SettingRow
            label={settingsMessages.subscriptionStatus}
            description={settingsMessages.subscriptionDescription}
            value={<StatusPill on={subscription?.status === "active"} labels={statusLabels} />}
          />
          <div className="py-5">
            {subscription?.stripeCustomerId && billingEnabled ? (
              <form action="/api/billing/portal" method="post">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)]"
                >
                  {settingsMessages.manageBilling}
                </button>
              </form>
            ) : billingEnabled ? (
              <a
                href="/pricing"
                className="inline-flex rounded-full bg-[var(--primary)] px-5 py-2.5 text-[13px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)]"
              >
                {settingsMessages.choosePlan}
              </a>
            ) : (
              <span className="inline-flex rounded-full border px-5 py-2.5 text-[13px] font-medium text-[var(--plum-soft)]" style={{ borderColor: "rgba(43,27,53,0.08)" }}>
                {settingsMessages.billingDisabledButton}
              </span>
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
            {settingsMessages.accountSection}
          </p>
        </div>
        <div className="px-6">
          <SettingRow
            label={settingsMessages.email}
            description={settingsMessages.emailDescription}
            value={
              <span className="inline-flex flex-wrap items-center justify-end gap-2">
                <span>{user.email}</span>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={
                    user.emailVerified
                      ? { background: "rgba(155,175,155,0.12)", color: "var(--sage)" }
                      : { background: "rgba(166,95,74,0.10)", color: "var(--clay)" }
                  }
                >
                  {user.emailVerified ? settingsMessages.verified : settingsMessages.unverified}
                </span>
                {!user.emailVerified ? (
                  <a href={`/verify-email?email=${encodeURIComponent(user.email)}`} className="font-medium text-[var(--clay)] hover:text-[var(--primary)]">
                    {settingsMessages.sendLink}
                  </a>
                ) : null}
              </span>
            }
          />
          <SettingRow
            label={settingsMessages.name}
            value={user.name ?? "—"}
          />
          <SettingRow
            label={settingsMessages.guideStage}
            description={settingsMessages.guideStageDescription}
            value={
              <span className="font-medium text-[var(--primary)]">
                {commonMessages.stageOf.replace("{stage}", String(guideStage))}
              </span>
            }
          />
        </div>
        <form action={changePasswordAction} className="border-t px-6 py-5 space-y-4" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
          <div>
            <p className="text-[14px] font-medium text-[var(--primary)]">{settingsMessages.changePassword}</p>
            <p className="mt-0.5 text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
              {settingsMessages.changePasswordDescription}
            </p>
          </div>
          {params.password === "changed" ? (
            <p className="rounded-xl bg-[rgba(155,175,155,0.12)] px-4 py-3 text-[12px] font-medium text-[var(--sage)]">
              {settingsMessages.passwordUpdated}
            </p>
          ) : null}
          {params.password === "incorrect" ? (
            <p className="rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              {settingsMessages.passwordIncorrect}
            </p>
          ) : null}
          {params.password === "invalid" ? (
            <p className="rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              {settingsMessages.passwordInvalid}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-[12px] font-medium text-[var(--primary)]">
              {settingsMessages.currentPassword}
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
              {settingsMessages.newPassword}
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
              {settingsMessages.confirmPassword}
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
            {settingsMessages.updatePassword}
          </button>
        </form>
      </div>

      {/* ── Voice & Audio ───────────────────────────────────────── */}
      <VoiceSettingsSection
        messages={messages.voice.settings}
        commonMessages={commonMessages}
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
            {settingsMessages.dataControls}
          </p>
        </div>
        <div className="px-6">
          <SettingRow
            label={settingsMessages.exportData}
            description={settingsMessages.exportDataDescription}
            value={<a href="/api/account/export" className="font-medium text-[var(--clay)] hover:text-[var(--primary)]">{settingsMessages.downloadJson}</a>}
          />
          <SettingRow
            label={settingsMessages.deleteEntries}
            description={settingsMessages.deleteEntriesDescription}
            value={<a href="/dashboard" className="font-medium text-[var(--clay)] hover:text-[var(--primary)]">{settingsMessages.pastEntries}</a>}
          />
          <SettingRow
            label={settingsMessages.revokeSessions}
            description={settingsMessages.revokeSessionsDescription}
            value={
              <form action={revokeSessionsAction}>
                <RevokeSessionsButton action={revokeSessionsAction} />
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
            {settingsMessages.sessionManagement}
          </p>
        </div>
        <div className="px-6">
          {params.session === "revoked" ? (
            <p className="mt-5 rounded-xl bg-[rgba(155,175,155,0.12)] px-4 py-3 text-[12px] font-medium text-[var(--sage)]">
              {settingsMessages.sessionRevoked}
            </p>
          ) : null}
          {params.session === "invalid" ? (
            <p className="mt-5 rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              {settingsMessages.sessionInvalid}
            </p>
          ) : null}
          {sessions.length === 0 ? (
            <p className="py-5 text-[12px] font-light text-[var(--plum-soft)]">
              {settingsMessages.noSessions}
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(43,27,53,0.07)" }}>
              {sessions.map((session) => {
                const isCurrent = session.id === currentSession?.id

                return (
                  <div key={session.id} className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-[var(--primary)]">
                        {session.scope === "admin" ? settingsMessages.adminSession : settingsMessages.webSession}
                        {isCurrent ? ` · ${settingsMessages.currentSession}` : ""}
                      </p>
                      <p className="mt-0.5 text-[12px] font-light text-[var(--plum-soft)]">
                        {settingsMessages.lastSeenExpires
                          .replace("{lastSeen}", formatWebDateTime(session.lastSeenAt))
                          .replace("{expires}", formatWebDateTime(session.expiresAt))}
                      </p>
                      <p className="mt-0.5 text-[11px] font-light text-[var(--plum-soft)]/70">
                        {settingsMessages.createdAt.replace("{created}", formatWebDateTime(session.createdAt))}
                      </p>
                    </div>
                    <form action={revokeSessionAction}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <button
                        type="submit"
                        className="rounded-full border px-3 py-1.5 text-[11px] font-medium text-[var(--plum-soft)] hover:bg-[rgba(43,27,53,0.04)]"
                        style={{ borderColor: "rgba(43,27,53,0.08)" }}
                      >
                        {isCurrent ? settingsMessages.signOutHere : settingsMessages.revoke}
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
            {settingsMessages.deleteAccountSection}
          </p>
        </div>
        <form action={deleteAccountAction} className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[14px] font-medium text-[var(--primary)]">{settingsMessages.deleteAccountTitle}</p>
            <p className="mt-0.5 max-w-2xl text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
              {settingsMessages.deleteAccountDescription}
            </p>
          </div>
          {params.accountDelete === "incorrect" ? (
            <p className="rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              {settingsMessages.deletePasswordIncorrect}
            </p>
          ) : null}
          {params.accountDelete === "invalid" ? (
            <p className="rounded-xl bg-[rgba(166,95,74,0.10)] px-4 py-3 text-[12px] font-medium text-[var(--clay)]">
              {settingsMessages.deleteInvalid}
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="grid gap-1 text-[12px] font-medium text-[var(--primary)]">
              {settingsMessages.password}
              <input
                name="password"
                type="password"
                required
                minLength={1}
                autoComplete="current-password"
                className="rounded-xl border bg-white px-3 py-2 text-[13px] font-light text-[var(--primary)] outline-none focus:border-[var(--clay)]"
                style={{ borderColor: "rgba(43,27,53,0.12)" }}
              />
            </label>
            <label className="grid gap-1 text-[12px] font-medium text-[var(--primary)]">
              {settingsMessages.typeDelete}
              <input
                name="confirmation"
                type="text"
                required
                pattern="DELETE"
                title={settingsMessages.typeDeleteTitle}
                autoComplete="off"
                className="rounded-xl border bg-white px-3 py-2 text-[13px] font-light text-[var(--primary)] outline-none focus:border-[var(--clay)]"
                style={{ borderColor: "rgba(43,27,53,0.12)" }}
              />
            </label>
            <button
              type="submit"
              className="rounded-full border border-[rgba(166,95,74,0.28)] px-5 py-2.5 text-[13px] font-medium text-[var(--clay)] hover:bg-[rgba(166,95,74,0.08)]"
            >
              {settingsMessages.deleteAccountButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
