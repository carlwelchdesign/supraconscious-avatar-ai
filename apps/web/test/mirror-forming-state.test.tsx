import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MirrorFormingState } from "../src/components/journal/mirror-forming-state"

test("Mirror-forming state exposes one polite status and hides its visual", () => {
  const markup = renderToStaticMarkup(createElement(MirrorFormingState, {
    status: "The Guide is reflecting…",
    supportingText: "Stay with what you wrote while your reflection takes shape.",
  }))

  assert.match(markup, /role="status"/)
  assert.match(markup, /aria-live="polite"/)
  assert.match(markup, /aria-atomic="true"/)
  assert.equal((markup.match(/role="status"/g) ?? []).length, 1)
  assert.match(markup, /aria-hidden="true"/)
  assert.match(markup, /The Guide is reflecting…/)
  assert.match(markup, /Stay with what you wrote while your reflection takes shape\./)
})

test("Mirror-forming motion has an explicit static reduced-motion mode", () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8")
  const source = readFileSync(resolve(process.cwd(), "src/components/journal/mirror-forming-state.tsx"), "utf8")

  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /\.mirror-forming-motion[\s\S]*animation: none !important/)
  assert.match(css, /\.mirror-forming-motion[\s\S]*transform: none !important/)
  assert.match(source, /LivingField state="reflecting"/)
  assert.equal(/\b(orb|orbit|sphere|ring)\b/i.test(source), false)
  assert.equal(/mirror-forming-orbit|mirror-forming-ring|mirror-forming-orb/i.test(css), false)
})
