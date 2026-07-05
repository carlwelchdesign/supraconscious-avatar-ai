import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('widget uses inline status messaging instead of modal alerts', async () => {
  const html = await readFile(new URL('../src/widget/index.html', import.meta.url), 'utf8')
  const script = await readFile(new URL('../src/widget/widget.js', import.meta.url), 'utf8')

  assert.match(html, /id="status-message"/)
  assert.match(html, /aria-live="polite"/)
  assert.doesNotMatch(script, /alert\(/)
  assert.match(script, /setStatus\(/)
})

test('widget renders generated text through DOM text nodes', async () => {
  const script = await readFile(new URL('../src/widget/widget.js', import.meta.url), 'utf8')

  assert.doesNotMatch(script, /\.innerHTML\s*=/)
  assert.match(script, /textContent\s*=/)
  assert.match(script, /replaceChildren\(/)
})
