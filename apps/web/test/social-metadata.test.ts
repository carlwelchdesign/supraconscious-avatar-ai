import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const appRoot = path.resolve(process.cwd(), "src/app")

test("social metadata uses composed share images and the Observatory icon", () => {
  const layout = fs.readFileSync(path.join(appRoot, "layout.tsx"), "utf8")
  const socialCard = fs.readFileSync(path.join(appRoot, "social-card.tsx"), "utf8")
  const icon = fs.readFileSync(path.join(appRoot, "icon.tsx"), "utf8")

  assert.match(layout, /Honest reflection, in your own words/)
  assert.match(layout, /Keep what fits; the meaning and next choice remain yours/)
  assert.match(socialCard, /mineral-boundary-v3-wide\.png/)
  assert.match(socialCard, /A quieter place for/)
  assert.match(socialCard, /SEVEN EQUAL DIMENSIONS · YOUR WORDS STAY PRIMARY/)
  assert.match(icon, />S<\/div>/)
  assert.doesNotMatch(icon, /eye|orb/i)
})
