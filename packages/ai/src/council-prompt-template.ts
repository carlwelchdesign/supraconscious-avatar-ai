import { prisma } from "@inner-avatar/db"
import {
  DEFAULT_COUNCIL_PROMPT_KEY,
  DEFAULT_COUNCIL_PROMPT_VERSION,
  DEFAULT_COUNCIL_SYSTEM_PROMPT,
} from "./generate-council-run.js"

export type CouncilPromptTemplate = {
  key: string
  version: number
  content: string
  source: "db" | "fallback"
}

export type PromptTemplateGuardrailResult = {
  valid: boolean
  missing: string[]
}

type PromptTemplateRecord = {
  key: string
  version: number
  content: string
  active: boolean
}

type PromptTemplatePrisma = {
  promptTemplate: {
    findUnique(input: {
      where: { key: string }
      select: { key: true; version: true; content: true; active: true }
    }): Promise<PromptTemplateRecord | null>
  }
}

const REQUIRED_GUARDRAILS: Array<{ key: string; pattern: RegExp }> = [
  { key: "not_maria", pattern: /\bnot\s+Maria\b/i },
  { key: "not_therapy", pattern: /\bnot\s+(?:a\s+)?therap(?:y|ist)\b/i },
  { key: "no_channeling", pattern: /\b(?:do not|don't)\s+channel\b|\bnot\s+channel/i },
  { key: "one_integrator_question", pattern: /\bexactly\s+one\s+(?:integrator\s+)?question\b/i },
  { key: "concise_council_roles", pattern: /\bno more than two short sentences\b|\btwo short sentences\b/i },
  { key: "no_maria_says", pattern: /\bMaria says\b/i },
]

export async function resolveCouncilPromptTemplate(input: {
  key?: string
  prismaClient?: PromptTemplatePrisma
} = {}): Promise<CouncilPromptTemplate> {
  const key = input.key ?? DEFAULT_COUNCIL_PROMPT_KEY
  const prismaClient = input.prismaClient ?? prisma
  const template = await prismaClient.promptTemplate.findUnique({
    where: { key },
    select: { key: true, version: true, content: true, active: true },
  })

  if (template?.active && validateCouncilPromptTemplate(template.content).valid) {
    return {
      key: template.key,
      version: template.version,
      content: template.content,
      source: "db",
    }
  }

  return getFallbackCouncilPromptTemplate(key)
}

export function validateCouncilPromptTemplate(content: string): PromptTemplateGuardrailResult {
  const missing = REQUIRED_GUARDRAILS
    .filter((guardrail) => !guardrail.pattern.test(content))
    .map((guardrail) => guardrail.key)

  return {
    valid: missing.length === 0,
    missing,
  }
}

export function isCouncilPromptTemplateKey(key: string) {
  return key === DEFAULT_COUNCIL_PROMPT_KEY
}

export function getFallbackCouncilPromptTemplate(key = DEFAULT_COUNCIL_PROMPT_KEY): CouncilPromptTemplate {
  return {
    key,
    version: DEFAULT_COUNCIL_PROMPT_VERSION,
    content: DEFAULT_COUNCIL_SYSTEM_PROMPT,
    source: "fallback",
  }
}

export function buildCouncilPromptVersion(template: Pick<PromptTemplateRecord, "key" | "version">) {
  return `${template.key}@v${template.version}`
}
