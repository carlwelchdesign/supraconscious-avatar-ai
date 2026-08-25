import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8")
const theme = readFileSync(new URL("../src/components/mui-provider.tsx", import.meta.url), "utf8")
const shell = readFileSync(new URL("../src/components/admin-shell.tsx", import.meta.url), "utf8")
const navigation = readFileSync(new URL("../src/components/admin-navigation.tsx", import.meta.url), "utf8")

test("admin uses the restrained Observatory semantic palette", () => {
  for (const value of ["#050914", "#121321", "#f4ebdd", "#c87432", "#8ca0ff"]) {
    assert.match(css.toLowerCase(), new RegExp(value))
  }
  assert.match(theme, /mode: "dark"/)
  assert.match(theme, /minHeight: 44/)
})

test("admin navigation remains keyboard and long-list accessible", () => {
  assert.match(css, /:focus-visible/)
  assert.match(shell, /md:overflow-y-auto/)
  assert.match(shell, /min-h-11/)
  assert.match(shell, /Skip to content/)
  assert.match(navigation, /aria-current=\{active \? "page" : undefined\}/)
  assert.match(navigation, /<details className="border-b md:hidden">/)
})
