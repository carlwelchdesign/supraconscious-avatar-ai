import { test } from "node:test"
import assert from "node:assert"
import { buildJournalAnalyzeResponse } from "../src/lib/journal-analyze-response"

test("journal analyze response excludes raw journal text and internal record fields", () => {
  const response = buildJournalAnalyzeResponse({
    journalEntry: { id: "entry-1", rawText: "private text", userId: "user-1" } as any,
    safety: { severity: "none", flags: ["ok"], allowReflectiveFlow: true, userMessage: "internal" } as any,
    analysis: { summary: "Short summary", userId: "user-1", journalEntryId: "entry-1" } as any,
    avatarResponse: {
      openingLine: "Open",
      mirror: "Mirror",
      patternName: "Pattern",
      contradiction: "Contradiction",
      socraticQuestion: "Question?",
      integrationStep: "Step",
      closingLine: "Close",
      userId: "user-1",
    } as any,
    prompt: {
      title: "Prompt",
      context: "Context",
      materials: "Pen",
      execution: "Write",
      integration: "Reflect",
      userId: "user-1",
    } as any,
    progression: {
      levelChanged: false,
      stageChanged: false,
      newLevel: 1,
      newStage: 1,
      previousLevel: 1,
      previousStage: 1,
    },
    councilSession: {
      id: "session-1",
      userId: "user-1",
      observerSignal: { coreTension: "Tension" },
      messages: [
        {
          id: "message-1",
          role: "protector",
          displayName: "Protector",
          lens: "Safety",
          content: "Go slowly.",
          confidence: 0.7,
          abstained: false,
          userId: "user-1",
          evidence: ["internal"],
        },
      ],
      synthesis: {
        integratorQuestion: "What is true now?",
        integrationStep: "Breathe once.",
        coreTension: "Tension",
        userId: "user-1",
      },
    } as any,
    sourceProvenance: {
      sourceMode: "none",
      message: "No source.",
      sources: [],
    },
  })

  assert.deepEqual(response.journalEntry, { id: "entry-1" })
  assert.equal(JSON.stringify(response).includes("private text"), false)
  assert.equal(JSON.stringify(response).includes("user-1"), false)
  assert.equal(JSON.stringify(response).includes("journalEntryId"), false)
  assert.equal(JSON.stringify(response).includes("evidence"), false)
})
