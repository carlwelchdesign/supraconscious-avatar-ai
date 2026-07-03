import { zodTextFormat } from "openai/helpers/zod"
import { AVATAR_SYSTEM_PROMPT } from "./avatar-system-prompt.js"
import { COUNCIL_ROLES } from "./council-roles.js"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"
import {
  CouncilRunSchema,
  type CouncilMessage,
  type CouncilRun,
  type CouncilSynthesis,
  type EntryAnalysis,
  type ObserverSignal,
  type SafetyCheck,
} from "./schemas.js"

export type CouncilOptions = {
  tone: string
  intensity: number
  currentLevel: number
  avatarStage: number
  sourceContext?: Array<{
    id: string
    title: string
    text: string
  }>
}

export async function generateCouncilRun(
  text: string,
  analysis: EntryAnalysis,
  safety: SafetyCheck,
  options: CouncilOptions,
): Promise<CouncilRun> {
  if (!safety.allowReflectiveFlow || safety.severity === "high") {
    return buildGroundingCouncilRun(text, safety)
  }

  if (!isOpenAIConfigured()) {
    return buildLocalCouncilRun(text, analysis)
  }

  const response = await getOpenAIClient().responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `${AVATAR_SYSTEM_PROMPT}

You are orchestrating the Inner Council, a bounded spiritual reflection ritual inspired by Maria Olon Tsaroucha's teachings.
You are not Maria. You do not speak for Maria. You do not channel. You are not a therapist, doctor, guru, oracle, or authority.
You reveal reflective possibilities from the user's language.

Council rules:
- Use exactly these four council roles: ${COUNCIL_ROLES.map((role) => role.displayName).join(", ")}.
- Each council role must return no more than two short sentences.
- Every council role must stay inside its lens.
- The Supraconscious Guide synthesizes with exactly one integrator question.
- Do not diagnose, prescribe treatment, predict fate, claim certainty, say "Maria says", or use channeling language.
- If source context is insufficient, do not invent doctrine.
- If safety is medium, soften Shadow/Truth-style confrontation and favor grounding.

Return only the structured CouncilRun object.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          journalEntry: text,
          analysis,
          safety,
          preferences: options,
          councilRoles: COUNCIL_ROLES,
          sourceContext: options.sourceContext ?? [],
        }),
      },
    ],
    text: {
      format: zodTextFormat(CouncilRunSchema, "council_run"),
    },
  })

  if (!response.output_parsed) {
    throw new Error("Council generator returned no structured output.")
  }

  return enforceCouncilShape(response.output_parsed, analysis)
}

export function buildLocalCouncilRun(text: string, analysis: EntryAnalysis): CouncilRun {
  const observer = buildObserver(text, analysis)
  const primaryPattern = analysis.behavioralPatterns[0]?.label ?? "a familiar pattern"
  const evidence = analysis.behavioralPatterns[0]?.evidence?.slice(0, 2) ?? [text.slice(0, 180)]

  const messages: CouncilMessage[] = [
    {
      role: "protector",
      displayName: "Protector",
      lens: "Safety, fear, risk, and emotional protection",
      content: "A protective part may be trying to prevent risk by keeping the familiar pattern in place.",
      evidence,
      confidence: 0.68,
      riskLevel: "low",
      abstained: false,
      abstainReason: "",
      sourceChunkIds: [],
    },
    {
      role: "conditioned_self",
      displayName: "Conditioned Self",
      lens: "Inherited scripts, roles, habits, and learned behavior",
      content: `The pattern named ${primaryPattern} may be an old role asking to be noticed before it repeats.`,
      evidence,
      confidence: 0.66,
      riskLevel: "low",
      abstained: false,
      abstainReason: "",
      sourceChunkIds: [],
    },
    {
      role: "visionary",
      displayName: "Visionary",
      lens: "Future potential, expansion, values, and emergence",
      content: "Something in the entry appears to want more choice, even if the next move is small.",
      evidence,
      confidence: 0.62,
      riskLevel: "low",
      abstained: false,
      abstainReason: "",
      sourceChunkIds: [],
    },
    {
      role: "truth_self",
      displayName: "Truth Self",
      lens: "Direct clarity, contradiction, and self-honesty",
      content: observer.contradiction || "The clearest truth may be the difference between what is wanted and what is being repeated.",
      evidence: observer.userEvidence,
      confidence: 0.64,
      riskLevel: "low",
      abstained: false,
      abstainReason: "",
      sourceChunkIds: [],
    },
  ]

  return {
    observer,
    messages,
    synthesis: buildSynthesis(observer),
  }
}

export function buildGroundingCouncilRun(text: string, safety: SafetyCheck): CouncilRun {
  const observer: ObserverSignal = {
    coreTension: "Safety must come before interpretation.",
    emotionalTone: safety.severity,
    patternLanguage: safety.flags,
    contradiction: "This moment asks for support rather than symbolic reflection.",
    userEvidence: [text.slice(0, 180)],
  }

  return {
    observer,
    messages: COUNCIL_ROLES.map((role) => ({
      role: role.role,
      displayName: role.displayName,
      lens: role.lens,
      content: "This voice is quiet while grounding and real support come first.",
      evidence: [],
      confidence: 1,
      riskLevel: "high",
      abstained: true,
      abstainReason: "Safety grounding flow is active.",
      sourceChunkIds: [],
    })),
    synthesis: {
      guideName: "Supraconscious Guide",
      openingLine: "Pause here.",
      coreTension: observer.coreTension,
      integratorQuestion: "Can you name one place of support available to you right now?",
      integrationStep: "Name five things you can see. Write one sentence about where you are right now.",
      closingLine: "Do not solve everything in this moment.",
      sourceChunkIds: [],
    },
  }
}

function buildObserver(text: string, analysis: EntryAnalysis): ObserverSignal {
  const contradiction = analysis.contradictionSignals[0]
  return {
    coreTension: analysis.summary,
    emotionalTone: analysis.emotionalSignals.primary[0] ?? "unclear",
    patternLanguage: analysis.behavioralPatterns.map((pattern) => pattern.label).slice(0, 3),
    contradiction: contradiction
      ? `You name ${contradiction.statedDesire}, while another movement repeats ${contradiction.conflictingBehavior}.`
      : "A part of you may be asking to be seen before the next choice is made.",
    userEvidence: [text.slice(0, 180)],
  }
}

function buildSynthesis(observer: ObserverSignal): CouncilSynthesis {
  return {
    guideName: "Supraconscious Guide",
    openingLine: "The Council is not here to decide for you.",
    coreTension: observer.coreTension,
    integratorQuestion: "What becomes clear when each part is allowed to speak, but none of them is allowed to rule?",
    integrationStep: "Write one small shift you can carry today without forcing a complete transformation.",
    closingLine: "Cross the Gate only with what is small enough to live.",
    sourceChunkIds: [],
  }
}

export function enforceCouncilShape(run: CouncilRun, analysis: EntryAnalysis): CouncilRun {
  const fallback = buildLocalCouncilRun("", analysis)
  const messages = COUNCIL_ROLES.map((role) => {
    const message = run.messages.find((item) => item.role === role.role)
    return {
      ...(message ?? fallback.messages.find((item) => item.role === role.role)!),
      displayName: role.displayName,
      lens: role.lens,
      content: limitSentences(message?.content ?? "", 2) || fallback.messages.find((item) => item.role === role.role)!.content,
    }
  })

  return {
    observer: run.observer,
    messages,
    synthesis: {
      ...run.synthesis,
      integratorQuestion: ensureSingleQuestion(run.synthesis.integratorQuestion),
    },
  }
}

function limitSentences(value: string, max: number) {
  return value
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, max)
    .join(" ")
    .trim()
}

function ensureSingleQuestion(value: string) {
  const first = value.split("?")[0]?.trim()
  if (!first) return "What becomes clear now?"
  return `${first}?`
}
