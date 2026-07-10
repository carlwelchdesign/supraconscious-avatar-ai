export type GuideStageNumber = 1 | 2 | 3 | 4 | 5

export type GuideStageDisplayConfig = {
  stage: GuideStageNumber
  name: string
  description: string
  trait: string
  guideEyebrow: string
  guideTitle: string
  guideTitleEmphasis: string
  guideIntro: string
  timelineTitle: string
  currentLabel: string
  completedLabel: string
}

type AvatarStageConfigRow = {
  stage: number
  name: string
  description: string | null
  active: boolean
  metadata: unknown
}

type AvatarStageConfigReader = {
  avatarStageConfig: {
    findMany(args: {
      orderBy: { stage: "asc" }
      select: {
        stage: true
        name: true
        description: true
        active: true
        metadata: true
      }
    }): Promise<AvatarStageConfigRow[]>
  }
}

export const DEFAULT_GUIDE_STAGE_CONFIGS: GuideStageDisplayConfig[] = [
  {
    stage: 1,
    name: "Echo",
    description: "Reflects your language back with care. Mirrors tone and recurring words without interpretation.",
    trait: "Listening",
    guideEyebrow: "Your guide",
    guideTitle: "An inner presence,",
    guideTitleEmphasis: "not a chatbot.",
    guideIntro: "The guide adapts through evidence of reflection, not intensity. Each stage is earned gradually through the accumulated depth of your writing.",
    timelineTitle: "The five stages",
    currentLabel: "Current",
    completedLabel: "Complete",
  },
  {
    stage: 2,
    name: "Witness",
    description: "Begins naming what it observes. Notices emotional signals and language patterns.",
    trait: "Noticing",
    guideEyebrow: "Your guide",
    guideTitle: "An inner presence,",
    guideTitleEmphasis: "not a chatbot.",
    guideIntro: "The guide adapts through evidence of reflection, not intensity. Each stage is earned gradually through the accumulated depth of your writing.",
    timelineTitle: "The five stages",
    currentLabel: "Current",
    completedLabel: "Complete",
  },
  {
    stage: 3,
    name: "Clear Mirror",
    description: "Names contradictions gently. Helps you see the gap between what you say and what you feel.",
    trait: "Clarity",
    guideEyebrow: "Your guide",
    guideTitle: "An inner presence,",
    guideTitleEmphasis: "not a chatbot.",
    guideIntro: "The guide adapts through evidence of reflection, not intensity. Each stage is earned gradually through the accumulated depth of your writing.",
    timelineTitle: "The five stages",
    currentLabel: "Current",
    completedLabel: "Complete",
  },
  {
    stage: 4,
    name: "Reframer",
    description: "Offers alternative perspectives on recurring stories. Not prescriptive — expansive.",
    trait: "Perspective",
    guideEyebrow: "Your guide",
    guideTitle: "An inner presence,",
    guideTitleEmphasis: "not a chatbot.",
    guideIntro: "The guide adapts through evidence of reflection, not intensity. Each stage is earned gradually through the accumulated depth of your writing.",
    timelineTitle: "The five stages",
    currentLabel: "Current",
    completedLabel: "Complete",
  },
  {
    stage: 5,
    name: "Inner Author",
    description: "Supports you in writing new narratives. The deepest stage of integration.",
    trait: "Authorship",
    guideEyebrow: "Your guide",
    guideTitle: "An inner presence,",
    guideTitleEmphasis: "not a chatbot.",
    guideIntro: "The guide adapts through evidence of reflection, not intensity. Each stage is earned gradually through the accumulated depth of your writing.",
    timelineTitle: "The five stages",
    currentLabel: "Current",
    completedLabel: "Complete",
  },
]

export function normalizeGuideStage(stageNumber: number | null | undefined): GuideStageNumber {
  const stage = Math.round(Number(stageNumber ?? 1))
  if (!Number.isFinite(stage)) return 1
  return Math.min(Math.max(stage, 1), 5) as GuideStageNumber
}

export async function getGuideStageConfigs(client: AvatarStageConfigReader): Promise<GuideStageDisplayConfig[]> {
  const rows = await client.avatarStageConfig.findMany({
    orderBy: { stage: "asc" },
    select: {
      stage: true,
      name: true,
      description: true,
      active: true,
      metadata: true,
    },
  })

  return mergeGuideStageConfigs(rows)
}

export async function getGuideStageConfigForStage(
  client: AvatarStageConfigReader,
  stage: number | null | undefined,
): Promise<GuideStageDisplayConfig> {
  const configs = await getGuideStageConfigs(client)
  return readGuideStageConfig(configs, stage)
}

export function readGuideStageConfig(
  configs: GuideStageDisplayConfig[],
  stage: number | null | undefined,
): GuideStageDisplayConfig {
  const normalized = normalizeGuideStage(stage)
  return configs.find((config) => config.stage === normalized) ?? DEFAULT_GUIDE_STAGE_CONFIGS[normalized - 1]
}

export function readGuideStageNames(configs: GuideStageDisplayConfig[]) {
  return DEFAULT_GUIDE_STAGE_CONFIGS.map((defaultConfig) => readGuideStageConfig(configs, defaultConfig.stage).name)
}

export function mergeGuideStageConfigs(rows: AvatarStageConfigRow[]): GuideStageDisplayConfig[] {
  const activeRows = new Map(
    rows
      .filter((row) => row.active)
      .map((row) => [normalizeGuideStage(row.stage), row]),
  )

  return DEFAULT_GUIDE_STAGE_CONFIGS.map((defaultConfig) => {
    const row = activeRows.get(defaultConfig.stage)
    if (!row) return defaultConfig

    const metadata = readStageMetadata(row.metadata)
    return {
      stage: defaultConfig.stage,
      name: readText(row.name, defaultConfig.name),
      description: readText(row.description, defaultConfig.description),
      trait: readText(metadata.trait, defaultConfig.trait),
      guideEyebrow: readText(metadata.guideEyebrow, defaultConfig.guideEyebrow),
      guideTitle: readText(metadata.guideTitle, defaultConfig.guideTitle),
      guideTitleEmphasis: readText(metadata.guideTitleEmphasis, defaultConfig.guideTitleEmphasis),
      guideIntro: readText(metadata.guideIntro, defaultConfig.guideIntro),
      timelineTitle: readText(metadata.timelineTitle, defaultConfig.timelineTitle),
      currentLabel: readText(metadata.currentLabel, defaultConfig.currentLabel),
      completedLabel: readText(metadata.completedLabel, defaultConfig.completedLabel),
    }
  })
}

function readStageMetadata(value: unknown): Partial<Record<keyof GuideStageDisplayConfig, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<Record<keyof GuideStageDisplayConfig, unknown>>
    : {}
}

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}
