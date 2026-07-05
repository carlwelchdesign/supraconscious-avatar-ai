import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('package build copies widget static assets for production runtime', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const copyScript = await readFile(new URL('../scripts/copy-widget-assets.mjs', import.meta.url), 'utf8')

  assert.match(packageJson.scripts.build, /copy-widget-assets\.mjs/)
  assert.match(copyScript, /index\.html/)
  assert.match(copyScript, /styles\.css/)
  assert.match(copyScript, /dist/)
})

test('widget uses inline status messaging instead of modal alerts', async () => {
  const html = await readFile(new URL('../src/widget/index.html', import.meta.url), 'utf8')
  const script = await readFile(new URL('../src/widget/widget.js', import.meta.url), 'utf8')

  assert.match(html, /id="status-message"/)
  assert.match(html, /aria-live="polite"/)
  assert.match(html, /src="config\.js"/)
  assert.doesNotMatch(script, /alert\(/)
  assert.match(script, /setStatus\(/)
})

test('widget renders generated text through DOM text nodes', async () => {
  const script = await readFile(new URL('../src/widget/widget.js', import.meta.url), 'utf8')

  assert.doesNotMatch(script, /\.innerHTML\s*=/)
  assert.doesNotMatch(script, /inner-avatar\.ai/)
  assert.match(script, /textContent\s*=/)
  assert.match(script, /replaceChildren\(/)
  assert.match(script, /INNER_AVATAR_WIDGET_CONFIG/)
})
