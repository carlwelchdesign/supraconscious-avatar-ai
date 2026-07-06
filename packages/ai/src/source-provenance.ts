export const SOURCE_PROVENANCE_PILOT_SCOPE =
  "This guide is inspired by Maria Olon Tsaroucha's teachings; it is not Maria, therapy, crisis monitoring, or spiritual authority."

export function buildSourceProvenanceMessage(sourceMode: string | null | undefined) {
  if (sourceMode === "rag") {
    return "This reflection used approved source material as background. The response is paraphrased unless a quoted excerpt is shown."
  }

  if (sourceMode === "no_eligible_source") {
    return "No approved source material matched this entry. Your reflection used only your journal text and the app's guidance rules."
  }

  if (sourceMode === "grounding") {
    return "Source retrieval was not used because this reflection stayed with grounding and safety guidance."
  }

  return "No source retrieval was used for this reflection. Your reflection used only your journal text and the app's guidance rules."
}
