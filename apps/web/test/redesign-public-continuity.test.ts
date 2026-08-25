import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const landing = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8")
const pricing = readFileSync(new URL("../src/app/(marketing)/pricing/page.tsx", import.meta.url), "utf8")
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8")
const messages = JSON.parse(readFileSync(new URL("../src/messages/en.json", import.meta.url), "utf8"))

test("public journey uses the Observatory system and demonstrates reflection boundaries", () => {
  assert.match(landing, /member-app public-observatory/)
  assert.match(pricing, /member-app public-observatory/)
  assert.match(landing, /reflection\.memberWordsEyebrow/)
  assert.match(landing, /reflection\.guideWordsEyebrow/)
  assert.match(landing, /reflection\.memberActionEyebrow/)
  assert.match(css, /\.public-observatory/)
})

test("warmer English copy preserves the locked doctrine contract", () => {
  assert.equal(messages.landing.shiftBody, "Each dimension is an equally valid facet of consciousness. None is a rank, level, or identity.")
  assert.deepEqual(messages.landing.experienceSteps, ["Write", "See", "Face", "Choose", "Become"])
  assert.deepEqual(messages.landing.councilRoles.map((role: { body: string }) => role.body), [
    "What am I noticing?",
    "What meaning have I created?",
    "What am I protecting?",
    "Which identity is responding?",
    "What higher possibility is available?",
    "What conscious choice is now possible?",
    "How will I live that choice?",
  ])
  assert.ok(messages.landing.changeQuestionBody.indexOf("fearful self") < messages.landing.changeQuestionBody.indexOf("genius self"))
})

test("continuity copy remains tentative and member-authored", () => {
  assert.match(messages.dashboard.guideHeroBody, /may fit/)
  assert.match(messages.patterns.body, /recurs across multiple entries/)
  assert.match(messages.patterns.footnote, /not diagnoses/)
  assert.match(messages.settings.guideStageDescription, /dimensions used may vary/)
  assert.match(messages.journal.helper, /words stay primary/)
})
