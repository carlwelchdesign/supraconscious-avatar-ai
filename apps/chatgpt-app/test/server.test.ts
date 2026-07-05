import { test } from 'node:test'
import assert from 'node:assert'
import { startChatGptApp } from '../src/server'

let server: any

test('server health endpoint responds with ok status', async () => {
  server = startChatGptApp(0)
  const address = server.address()
  const port = typeof address === 'string' ? 0 : address.port
  const response = await fetch(`http://127.0.0.1:${port}/health`)
  const body = await response.json()

  assert.strictEqual(response.status, 200)
  assert.strictEqual(body.status, 'ok')
  assert.ok(body.timestamp)

  server.close()
})

test('server exposes MCP tools metadata', async () => {
  server = startChatGptApp(0)
  const address = server.address()
  const port = typeof address === 'string' ? 0 : address.port
  const response = await fetch(`http://127.0.0.1:${port}/mcp/tools`)
  const body = await response.json()

  assert.strictEqual(response.status, 200)
  assert.ok(Array.isArray(body.tools))
  assert.strictEqual(body.tools.length, 6)
  assert.ok(body.tools.some((tool: any) => tool.name === 'analyze_journal_entry'))

  server.close()
})

test('server exposes widget config with normalized web app URL', async () => {
  const previousWebUrl = process.env.INNER_AVATAR_WEB_URL
  process.env.INNER_AVATAR_WEB_URL = 'https://web.example/'
  server = startChatGptApp(0)
  try {
    const address = server.address()
    const port = typeof address === 'string' ? 0 : address.port
    const response = await fetch(`http://127.0.0.1:${port}/widget/config.js`)
    const body = await response.text()

    assert.strictEqual(response.status, 200)
    assert.match(response.headers.get('content-type') ?? '', /javascript/)
    assert.match(body, /INNER_AVATAR_WIDGET_CONFIG/)
    assert.match(body, /"webAppUrl":"https:\/\/web\.example"/)
    assert.doesNotMatch(body, /web\.example\//)
  } finally {
    server.close()
    if (previousWebUrl === undefined) {
      delete process.env.INNER_AVATAR_WEB_URL
    } else {
      process.env.INNER_AVATAR_WEB_URL = previousWebUrl
    }
  }
})
