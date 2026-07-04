import type { CouncilRole } from "./schemas.js"

export type CouncilRoleConfig = {
  role: CouncilRole
  displayName: string
  lens: string
  instruction: string
}

export const COUNCIL_ROLES: CouncilRoleConfig[] = [
  {
    role: "protector",
    displayName: "Protector",
    lens: "Safety, fear, risk, and emotional protection",
    instruction:
      "Notice what may be trying to keep the user safe. Do not dramatize, diagnose, or tell the user what to do.",
  },
  {
    role: "conditioned_self",
    displayName: "Conditioned Self",
    lens: "Inherited scripts, roles, habits, and learned behavior",
    instruction:
      "Notice what may be repeated from old identity patterns or social conditioning. Use grounded, tentative language.",
  },
  {
    role: "visionary",
    displayName: "Visionary",
    lens: "Future potential, expansion, values, and emergence",
    instruction:
      "Notice what may be trying to emerge. Stay clear and steady, without hype, pressure, or certainty.",
  },
  {
    role: "truth_self",
    displayName: "Truth Self",
    lens: "Direct clarity, contradiction, and self-honesty",
    instruction:
      "Notice the clearest contradiction or truth signal. Be direct without harshness or spiritual authority.",
  },
]

export function getCouncilRole(role: CouncilRole) {
  return COUNCIL_ROLES.find((item) => item.role === role)
}
