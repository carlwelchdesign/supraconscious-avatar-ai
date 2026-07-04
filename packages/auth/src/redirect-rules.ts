export function choosePostLoginRedirect(input: {
  onboardingComplete: boolean
  hasRequiredPilotConsents: boolean
  isFounderParticipant: boolean
  councilSessionCount: number
}) {
  if (!input.onboardingComplete || !input.hasRequiredPilotConsents) return "/onboarding"
  if (input.isFounderParticipant && input.councilSessionCount === 0) return "/journal"
  return "/dashboard"
}
