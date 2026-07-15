import assert from "node:assert/strict"
import { normalizeDatabaseConnectionString } from "@inner-avatar/db"

assert.equal(
  new URL(normalizeDatabaseConnectionString("postgres://user:pass@db.example.com/app?sslmode=require") ?? "").searchParams.get("sslmode"),
  "verify-full",
)

assert.equal(
  new URL(normalizeDatabaseConnectionString("postgres://user:pass@db.example.com/app?sslmode=verify-ca") ?? "").searchParams.get("sslmode"),
  "verify-full",
)

assert.equal(
  new URL(normalizeDatabaseConnectionString("postgres://user:pass@db.example.com/app?uselibpqcompat=true&sslmode=require") ?? "").searchParams.get("sslmode"),
  "require",
)

assert.equal(
  normalizeDatabaseConnectionString("not a url"),
  "not a url",
)
