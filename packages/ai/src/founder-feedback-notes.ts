export const FOUNDER_FEEDBACK_NOTE_TEMPLATES = [
  "Voice mismatch: ",
  "Source unsupported: ",
  "Too generic: ",
  "Too intense: ",
  "Good enough: ",
  "Maria would phrase it this way: ",
] as const

const MIN_FOUNDER_FEEDBACK_DETAIL_LENGTH = 8

export function getFounderFeedbackDetail(note: string | null | undefined) {
  const trimmed = note?.trim() ?? ""
  if (!trimmed) return ""

  const matchingTemplate = FOUNDER_FEEDBACK_NOTE_TEMPLATES.find((template) =>
    trimmed.toLowerCase().startsWith(template.trim().toLowerCase()),
  )

  return matchingTemplate
    ? trimmed.slice(matchingTemplate.trim().length).replace(/^:\s*/, "").trim()
    : trimmed
}

export function isFounderCalibrationFeedbackNoteUseful(note: string | null | undefined) {
  return getFounderFeedbackDetail(note).length >= MIN_FOUNDER_FEEDBACK_DETAIL_LENGTH
}
