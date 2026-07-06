import { test } from "node:test"
import assert from "node:assert"
import { buildLegacyAvatarResponse, buildLegacyPromptResponse } from "../src/lib/legacy-reflection-response"
import { buildPatternsResponse } from "../src/lib/patterns-response"

test("patterns response replaces raw journal text with short excerpts", () => {
  const response = buildPatternsResponse({
    patterns: [
      {
        id: "pattern-1",
        patternType: "overthinking",
        patternLabel: "Overthinking",
        evidenceCount: 2,
        confidence: 0.8,
        active: true,
        firstSeenAt: new Date("2026-07-05T12:00:00.000Z"),
        lastSeenAt: new Date("2026-07-05T12:00:00.000Z"),
        examples: ["internal"],
        userId: "user-1",
      } as any,
    ],
    recentEntries: [
      {
        id: "entry-1",
        rawText: "private journal text with enough words to be recognizable",
        inputMode: "text",
        createdAt: new Date("2026-07-05T12:00:00.000Z"),
        analysis: { summary: "A summary.", userId: "user-1" },
        avatarResponse: { mirror: "Mirror", patternName: "Pattern", integrationStep: "Step", userId: "user-1" },
        generatedPrompts: [{ title: "Prompt", execution: "Write", integration: "Reflect", userId: "user-1" }],
        userId: "user-1",
      } as any,
    ],
  })

  assert.equal(response.recentEntries[0]?.excerpt, "private journal text with enough words to be recognizable")
  assert.equal(JSON.stringify(response).includes("rawText"), false)
  assert.equal(JSON.stringify(response).includes("user-1"), false)
  assert.equal(JSON.stringify(response).includes("internal"), false)
})

test("legacy avatar and prompt responses exclude internal persistence fields", () => {
  const avatarResponse = buildLegacyAvatarResponse({
    journalEntryId: "entry-1",
    safety: { severity: "none", flags: [], internal: true } as any,
    analysis: { summary: "Summary", suggestedLevel: 2, userId: "user-1" } as any,
    avatarResponse: { id: "avatar-1", mirror: "Mirror", userId: "user-1", journalEntryId: "entry-1" } as any,
  })
  const promptResponse = buildLegacyPromptResponse({
    journalEntryId: "entry-1",
    safety: { severity: "none", flags: [], internal: true } as any,
    analysis: { summary: "Summary", suggestedLevel: 2, userId: "user-1" } as any,
    prompt: {
      id: "prompt-1",
      title: "Prompt",
      context: "Context",
      execution: "Write",
      integration: "Reflect",
      userId: "user-1",
      journalEntryId: "entry-1",
    } as any,
  })

  assert.equal(JSON.stringify(avatarResponse).includes("user-1"), false)
  assert.equal(JSON.stringify(avatarResponse).includes("internal"), false)
  assert.equal(JSON.stringify(promptResponse).includes("user-1"), false)
  assert.equal(JSON.stringify(promptResponse).includes("internal"), false)
})
