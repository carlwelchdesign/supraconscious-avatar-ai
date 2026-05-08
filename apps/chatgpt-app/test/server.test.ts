import { test } from 'node:test'
import assert from 'node:assert'
import { startChatGptApp } from '../src/server'

let server: any

test('server health endpoint responds with ok status', async (t) => {
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