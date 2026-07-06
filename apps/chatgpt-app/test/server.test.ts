import { test } from 'node:test'
import assert from 'node:assert'
import net from 'node:net'
import { startChatGptApp } from '../src/server'

let server: any

test('server health endpoint responds with ok status', async () => {
  const previousLog = console.log
  const logs: string[] = []
  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(' '))
  }
  try {
    server = startChatGptApp(0)
    const address = server.address()
    const port = typeof address === 'string' ? 0 : address.port
    const response = await fetch(`http://127.0.0.1:${port}/health`)
    const body = await response.json()

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers.get('cache-control'), 'no-store, max-age=0')
    assert.strictEqual(response.headers.get('x-content-type-options'), 'nosniff')
    assert.strictEqual(body.status, 'ok')
    assert.strictEqual(body.service, 'inner-avatar-chatgpt-app')
    assert.ok(body.timestamp)
    assert.ok(logs.some((line) => line.includes(`port ${port}`)))
    assert.ok(logs.some((line) => line.includes(`localhost:${port}/health`)))
    assert.equal(logs.some((line) => line.includes('localhost:0')), false)
  } finally {
    console.log = previousLog
    server?.close()
  }
})

test('server exposes MCP tools metadata', async () => {
  server = startChatGptApp(0)
  const address = server.address()
  const port = typeof address === 'string' ? 0 : address.port
  const response = await fetch(`http://127.0.0.1:${port}/mcp/tools`)
  const body = await response.json()

  assert.strictEqual(response.status, 200)
  assert.ok(Array.isArray(body.tools))
  assert.strictEqual(body.tools.length, 7)
  assert.ok(body.tools.some((tool: any) => tool.name === 'analyze_journal_entry'))
  assert.ok(body.tools.some((tool: any) => tool.name === 'run_inner_council_reflection'))

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
    assert.strictEqual(response.headers.get('cache-control'), 'no-store, max-age=0')
    assert.strictEqual(response.headers.get('x-content-type-options'), 'nosniff')
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

test('server redacts tool errors in production responses', async () => {
  const previousToken = process.env.CHATGPT_APP_API_TOKEN
  const previousNodeEnv = process.env.NODE_ENV
  const previousError = console.error
  const errors: string[] = []

  process.env.CHATGPT_APP_API_TOKEN = 'secret-token'
  process.env.NODE_ENV = 'production'
  console.error = (...args: unknown[]) => {
    errors.push(args.map((value) => typeof value === 'string' ? value : JSON.stringify(value)).join(' '))
  }

  server = startChatGptApp(0)
  try {
    const address = server.address()
    const port = typeof address === 'string' ? 0 : address.port
    const response = await fetch(`http://127.0.0.1:${port}/mcp/tools/create_journal_entry`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ text: 'This should not be saved without an authenticated user.' }),
    })
    const body = await response.json()

    assert.strictEqual(response.status, 400)
    assert.deepStrictEqual(body, { error: 'Tool execution failed' })
    assert.ok(errors.some((line) => line.includes('Tool execution error')))
    assert.equal(JSON.stringify(body).includes('Authentication required'), false)
  } finally {
    console.error = previousError
    server.close()
    if (previousToken === undefined) {
      delete process.env.CHATGPT_APP_API_TOKEN
    } else {
      process.env.CHATGPT_APP_API_TOKEN = previousToken
    }
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = previousNodeEnv
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
