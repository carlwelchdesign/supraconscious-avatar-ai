export function choosePostLoginRedirect(input: {
  onboardingComplete: boolean
  isFounderParticipant: boolean
  councilSessionCount: number
}) {
  if (!input.onboardingComplete) return "/onboarding"
  if (input.isFounderParticipant && input.councilSessionCount === 0) return "/journal"
  return "/dashboard"
}
