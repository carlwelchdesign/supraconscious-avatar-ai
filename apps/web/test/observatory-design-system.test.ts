import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8")
const shell = readFileSync(new URL("../src/components/layout/app-shell.tsx", import.meta.url), "utf8")
const desktopNavigation = readFileSync(new URL("../src/components/layout/desktop-navigation.tsx", import.meta.url), "utf8")
const mobileNavigation = readFileSync(new URL("../src/components/layout/mobile-bottom-nav.tsx", import.meta.url), "utf8")
const providers = readFileSync(new URL("../src/components/providers/app-providers.tsx", import.meta.url), "utf8")

test("Observatory foundation exposes semantic roles and legacy compatibility aliases", () => {
  for (const token of [
    "--canvas",
    "--surface",
    "--surface-raised",
    "--text-primary",
    "--text-secondary",
    "--border-subtle",
    "--border-active",
    "--action-primary",
    "--signal-selection",
    "--signal-success",
    "--signal-danger",
  ]) {
    assert.match(css, new RegExp(`${token}:`))
  }

  assert.match(css, /\.member-app[\s\S]*--background: var\(--canvas\)/)
  assert.match(css, /\.member-app[\s\S]*--pearl: var\(--surface-raised\)/)
})

test("member shell provides visible focus and responsive navigation landmarks", () => {
  assert.match(css, /\.member-app :where\([\s\S]*\):focus-visible[\s\S]*outline: 2px solid var\(--focus-ring\)/)
  assert.match(css, /\.member-app ::placeholder[\s\S]*opacity: 1/)
  assert.match(css, /\.member-app \.journal-lines/)
  assert.match(shell, /className="member-app"/)
  assert.match(shell, /<header/)
  assert.match(shell, /<main/)
  assert.match(desktopNavigation, /aria-label="Primary"/)
  assert.match(desktopNavigation, /aria-current=\{active \? "page" : undefined\}/)
  assert.match(mobileNavigation, /aria-label="Primary"/)
  assert.match(mobileNavigation, /min-h-16/)
  assert.match(providers, /NextIntlClientProvider locale=\{locale\} messages=\{messages\} timeZone=\{timeZone\}/)
})
