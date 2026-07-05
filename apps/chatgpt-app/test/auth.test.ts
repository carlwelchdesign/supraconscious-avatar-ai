import { test } from 'node:test'
import assert from 'node:assert'
import { authMiddleware, type AuthenticatedRequest } from '../src/middleware/auth'

class MockResponse {
  statusCode = 200
  body: any = null
  status(code: number) {
    this.statusCode = code
    return this
  }
  json(payload: any) {
    this.body = payload
    return this
  }
}

test('authMiddleware allows anonymous analysis access when no token is configured', async () => {
  const previousToken = process.env.CHATGPT_APP_API_TOKEN
  delete process.env.CHATGPT_APP_API_TOKEN
  const req = { headers: {}, body: {} } as AuthenticatedRequest
  const res = new MockResponse()

  try {
    let nextCalled = false
    await authMiddleware(req, res as any, () => {
      nextCalled = true
    })

    assert.strictEqual(nextCalled, true)
    assert.strictEqual(req.userId, undefined)
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.body, null)
  } finally {
    if (previousToken === undefined) {
      delete process.env.CHATGPT_APP_API_TOKEN
    } else {
      process.env.CHATGPT_APP_API_TOKEN = previousToken
    }
  }
})

test('authMiddleware rejects invalid bearer token when token auth is configured', async () => {
  const previousToken = process.env.CHATGPT_APP_API_TOKEN
  process.env.CHATGPT_APP_API_TOKEN = 'secret-token'
  const req = { headers: { authorization: 'Bearer wrong-token' }, body: {} } as AuthenticatedRequest
  const res = new MockResponse()

  try {
    let nextCalled = false
    await authMiddleware(req, res as any, () => {
      nextCalled = true
    })

    assert.strictEqual(nextCalled, false)
    assert.strictEqual(res.statusCode, 401)
    assert.deepStrictEqual(res.body, { error: 'Authentication failed' })
  } finally {
    if (previousToken === undefined) {
      delete process.env.CHATGPT_APP_API_TOKEN
    } else {
      process.env.CHATGPT_APP_API_TOKEN = previousToken
    }
  }
})

test('authMiddleware accepts bearer token and trusted user id header', async () => {
  const previousToken = process.env.CHATGPT_APP_API_TOKEN
  process.env.CHATGPT_APP_API_TOKEN = 'secret-token'
  const req = {
    headers: {
      authorization: 'Bearer secret-token',
      'x-inner-avatar-user-id': 'user_12345678',
    },
    body: {},
  } as AuthenticatedRequest
  const res = new MockResponse()

  try {
    let nextCalled = false
    await authMiddleware(req, res as any, () => {
      nextCalled = true
    })

    assert.strictEqual(nextCalled, true)
    assert.strictEqual(req.userId, 'user_12345678')
    assert.strictEqual(res.statusCode, 200)
  } finally {
    if (previousToken === undefined) {
      delete process.env.CHATGPT_APP_API_TOKEN
    } else {
      process.env.CHATGPT_APP_API_TOKEN = previousToken
    }
  }
})
