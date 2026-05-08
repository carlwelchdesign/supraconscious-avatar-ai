import { test } from 'node:test'
import assert from 'node:assert'
import { createSafetyMiddleware } from '../src/middleware/safety'

test('safety middleware attaches _safety on request body and calls next', async () => {
  const req = { body: { text: 'I feel calm and thoughtful' } } as any
  let nextCalled = false

  const middleware = createSafetyMiddleware(async (text: string) => {
    assert.strictEqual(text, 'I feel calm and thoughtful')
    return { severity: 'none', summary: 'clear' }
  })

  await middleware(req, {} as any, () => {
    nextCalled = true
  })

  assert.strictEqual(nextCalled, true)
  assert.deepStrictEqual(req.body._safety, { severity: 'none', summary: 'clear' })
})

test('safety middleware does not attach _safety when no text is provided', async () => {
  const req = { body: {} } as any
  let nextCalled = false

  const middleware = createSafetyMiddleware(async () => {
    throw new Error('Should not be called')
  })

  await middleware(req, {} as any, () => {
    nextCalled = true
  })

  assert.strictEqual(nextCalled, true)
  assert.strictEqual(req.body._safety, undefined)
})