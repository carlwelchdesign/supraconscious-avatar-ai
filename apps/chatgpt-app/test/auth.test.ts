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

test('authMiddleware allows anonymous access and sets userId undefined', async () => {
  const req = { headers: {}, body: {} } as AuthenticatedRequest
  const res = new MockResponse()

  let nextCalled = false
  await authMiddleware(req, res as any, () => {
    nextCalled = true
  })

  assert.strictEqual(nextCalled, true)
  assert.strictEqual(req.userId, undefined)
  assert.strictEqual(res.statusCode, 200)
  assert.strictEqual(res.body, null)
})