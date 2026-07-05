import { test } from 'node:test'
import assert from 'node:assert'
import net from 'node:net'
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

test('server allows configured web origin in CORS', async () => {
  const previousWebUrl = process.env.INNER_AVATAR_WEB_URL
  process.env.INNER_AVATAR_WEB_URL = 'https://web.example/'
  server = startChatGptApp(0)
  try {
    const address = server.address()
    const port = typeof address === 'string' ? 0 : address.port
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { Origin: 'https://web.example' },
    })

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers.get('access-control-allow-origin'), 'https://web.example')
  } finally {
    server.close()
    if (previousWebUrl === undefined) {
      delete process.env.INNER_AVATAR_WEB_URL
    } else {
      process.env.INNER_AVATAR_WEB_URL = previousWebUrl
    }
  }
})

test('server uses host PORT when CHATGPT_APP_PORT is not set', async () => {
  const previousChatGptPort = process.env.CHATGPT_APP_PORT
  const previousPort = process.env.PORT
  const expectedPort = await getAvailablePort()
  delete process.env.CHATGPT_APP_PORT
  process.env.PORT = String(expectedPort)
  server = startChatGptApp()
  try {
    const address = server.address()
    const port = typeof address === 'string' ? 0 : address.port
    const response = await fetch(`http://127.0.0.1:${port}/health`)

    assert.strictEqual(port, expectedPort)
    assert.strictEqual(response.status, 200)
  } finally {
    server.close()
    if (previousChatGptPort === undefined) {
      delete process.env.CHATGPT_APP_PORT
    } else {
      process.env.CHATGPT_APP_PORT = previousChatGptPort
    }
    if (previousPort === undefined) {
      delete process.env.PORT
    } else {
      process.env.PORT = previousPort
    }
  }
})

function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const probe = net.createServer()
    probe.unref()
    probe.on('error', reject)
    probe.listen(0, () => {
      const address = probe.address()
      const port = typeof address === 'string' ? 0 : address?.port ?? 0
      probe.close((error) => error ? reject(error) : resolve(port))
    })
  })
}
