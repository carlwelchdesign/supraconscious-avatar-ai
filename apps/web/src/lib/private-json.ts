import { NextResponse } from "next/server"

type PrivateJsonInit = {
  status?: number
  statusText?: string
  headers?: HeadersInit
}

export const PRIVATE_JSON_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
} as const

export function privateJson<T>(body: T, init: PrivateJsonInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("Cache-Control", PRIVATE_JSON_HEADERS["Cache-Control"])
  headers.set("X-Content-Type-Options", PRIVATE_JSON_HEADERS["X-Content-Type-Options"])

  return NextResponse.json(body, {
    ...init,
    headers,
  })
}
