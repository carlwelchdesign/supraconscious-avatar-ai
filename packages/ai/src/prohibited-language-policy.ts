export const REMOVED_PUBLIC_TERMS = [
  "Inner Council",
  "Threshold",
  "Revelation",
  "Echo",
  "Witness",
  "Clear Mirror",
  "Reframer",
  "Inner Author",
] as const

export const FOUNDER_ATTRIBUTION_PATTERNS = Object.freeze([
  {
    key: "named_founder_authority_verb",
    pattern: /\bMaria(?:\s+Olon\s+Tsaroucha)?\s+(?:teaches|says|tells(?:\s+us)?|believes|wants|instructs|advises|recommends|explains|reveals|shows)\b/i,
  },
  {
    key: "named_founder_authority_frame",
    pattern: /\b(?:according\s+to|on\s+behalf\s+of)\s+(?:Maria|Maria\s+Olon\s+Tsaroucha)\b|\bas\s+(?:Maria|Maria\s+Olon\s+Tsaroucha)\s+(?:teaches|says|explains)\b/i,
  },
  {
    key: "named_founder_possessive_authority",
    pattern: /\bMaria(?:\s+Olon\s+Tsaroucha)?[’']s\s+(?:teaching|teachings|guidance|wisdom|advice|method|instructions?)\b/i,
  },
  {
    key: "named_founder_inspiration_claim",
    pattern: /\b(?:inspired\s+by|based\s+on|drawn\s+from)\s+Maria(?:\s+Olon\s+Tsaroucha)?[’']s\s+(?:teaching|teachings|guidance|wisdom|work)\b/i,
  },
  {
    key: "unnamed_founder_authority",
    pattern: /\bthe\s+founder(?:[’']s|\s+(?:teaches|says|believes|wants|instructs|advises|recommends|explains))\b/i,
  },
] as const)

export function findRemovedPublicTerms(text: string) {
  return REMOVED_PUBLIC_TERMS.filter((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(text))
}

export function findFounderAttributionPatterns(text: string) {
  return FOUNDER_ATTRIBUTION_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ key }) => key)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
