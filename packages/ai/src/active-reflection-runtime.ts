import {
  runCouncilReflection,
  type CouncilReflectionInput,
  type CouncilReflectionUser,
} from "./council-reflection-service.js"

export const ACTIVE_REFLECTION_RUNTIME_VERSION = "supraconscious-active-reflection-v1"

export const ACTIVE_REFLECTION_RUNTIME_POLICY = Object.freeze({
  guidePersona: "constant",
  legacyCouncilOrchestration: false,
  legacyPersonaStages: false,
  historicalCouncilRecords: "read_only_compatibility",
} as const)

export type ActiveReflectionUser = Omit<CouncilReflectionUser, "avatarStage"> & {
  /** Historical compatibility field. Active generation never reads it. */
  avatarStage?: number
}

export type ActiveReflectionInput = Omit<
  CouncilReflectionInput,
  "councilModeEnabled" | "ragEnabled" | "personaStageProgressionEnabled"
>

type ActiveReflectionDependencies = {
  runLegacyReflection?: typeof runCouncilReflection
}

export async function runActiveReflection(
  user: ActiveReflectionUser,
  input: ActiveReflectionInput,
  dependencies: ActiveReflectionDependencies = {},
) {
  const runLegacyReflection = dependencies.runLegacyReflection ?? runCouncilReflection

  return runLegacyReflection(
    {
      ...user,
      // The field remains required by the legacy persistence contract, but active
      // generation and progression are explicitly prevented from using it.
      avatarStage: 1,
    },
    {
      ...input,
      councilModeEnabled: false,
      ragEnabled: false,
      personaStageProgressionEnabled: false,
    },
  )
}
