import { redirect } from "next/navigation"
import { hasRequiredPilotConsents, REQUIRED_PILOT_CONSENTS } from "@inner-avatar/auth/consent"
import { readSafeNextPath } from "@inner-avatar/auth/safe-redirect"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { isFounderCalibrationUser } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { ONBOARDING_CONSENT_ITEMS } from "@/lib/onboarding-consent-copy"
import { resolveWebLanguage } from "@/lib/language"
import { buildOnboardingLoginRedirect } from "@/lib/onboarding-redirect"
import { getWebMessages } from "@/lib/web-messages"
import { acceptPilotOrientationAction } from "./actions"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const params = await searchParams
  const nextPath = readSafeNextPath(params.next)
  const user = await getCurrentUser()
  if (!user) redirect(buildOnboardingLoginRedirect(nextPath))
  const messages = getWebMessages(await resolveWebLanguage(user.preferredLanguage))
  const onboarding = messages.onboarding

  const [founderCalibrationMode, latestConsents] = await Promise.all([
    isFounderCalibrationUser(user.email),
    prisma.consentEvent.findMany({
      where: {
        userId: user.id,
        consentType: { in: [...REQUIRED_PILOT_CONSENTS] },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])
  if (user.onboardingComplete && hasRequiredPilotConsents(latestConsents)) redirect(nextPath || "/journal")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--clay)]">
          {onboarding.eyebrow}
        </p>
        <h1 className="font-display text-[38px] font-light leading-tight text-[var(--primary)]">
          {onboarding.title}
        </h1>
        <p className="mt-3 text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
          {onboarding.body}
        </p>
      </div>

      {params.error === "consent_required" && (
        <div className="rounded-2xl border px-5 py-4 text-[13px] text-[var(--destructive)]" style={{ borderColor: "rgba(191,64,64,0.2)", background: "rgba(191,64,64,0.06)" }}>
          {onboarding.consentRequired}
        </div>
      )}

      {founderCalibrationMode && (
        <div className="rounded-3xl border px-5 py-4" style={{ background: "var(--pearl)", borderColor: "rgba(184,137,90,0.18)" }}>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--clay)]">
            {onboarding.founderEyebrow}
          </p>
          <p className="mt-2 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
            {onboarding.founderBody}
          </p>
        </div>
      )}

      <form action={acceptPilotOrientationAction} className="rounded-3xl border p-6" style={{ background: "var(--pearl)", borderColor: "rgba(43,27,53,0.07)" }}>
        {nextPath && <input type="hidden" name="next" value={nextPath} />}
        <div className="space-y-4">
          {ONBOARDING_CONSENT_ITEMS.map(([name, label, required]) => (
            <label key={name} className="flex items-start gap-3 text-[14px] font-light leading-relaxed text-[var(--plum-soft)]">
              <input name={name} type="checkbox" className="mt-1 h-4 w-4 accent-[var(--clay)]" />
              <span>
                {onboarding.consents[name] ?? label}{" "}
                <span className="text-[12px] text-[var(--plum-soft)]/60">
                  {required ? onboarding.required : onboarding.optional}
                </span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-6 rounded-2xl px-5 py-4" style={{ background: "rgba(184,137,90,0.07)", border: "1px solid rgba(184,137,90,0.15)" }}>
          <p className="text-[12px] font-light leading-relaxed text-[var(--plum-soft)]">
            {onboarding.safetyNote}
          </p>
        </div>
        <button type="submit" className="mt-6 rounded-full bg-[var(--primary)] px-6 py-3 text-[14px] font-medium text-[var(--cream)] hover:bg-[var(--plum-mid)]">
          {onboarding.beginFirstSession}
        </button>
      </form>

      {latestConsents.length > 0 && (
        <p className="text-[12px] font-light text-[var(--plum-soft)]/60">
          {onboarding.existingConsent}
        </p>
      )}
    </div>
  )
}
