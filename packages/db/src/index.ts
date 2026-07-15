import { existsSync } from "node:fs"
import path from "node:path"
import { PrismaPg } from "@prisma/adapter-pg"
import { Prisma, PrismaClient } from "@prisma/client"
import { config as loadDotenv } from "dotenv"

export * from "./pricing-content.js"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  loadLocalEnvFallback()
  const connectionString = normalizeDatabaseConnectionString(process.env.DATABASE_URL)

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  const adapter = new PrismaPg({ connectionString })
  const client = new PrismaClient({
    adapter,
    log: prismaLogLevels(),
  })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client
  }

  return client
}

function loadLocalEnvFallback() {
  if (process.env.DATABASE_URL || process.env.NODE_ENV === "production") {
    return
  }

  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env.local"),
    path.resolve(process.cwd(), "../../.env"),
  ]

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue

    loadDotenv({ path: candidate })
    if (process.env.DATABASE_URL) return
  }
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    const value = Reflect.get(client, prop, receiver)

    return typeof value === "function" ? value.bind(client) : value
  },
})

export default prisma

export function normalizeDatabaseConnectionString(connectionString: string | undefined) {
  if (!connectionString) return connectionString

  try {
    const parsed = new URL(connectionString)
    const sslMode = parsed.searchParams.get("sslmode")?.trim().toLowerCase()
    const useLibpqCompat = parsed.searchParams.get("uselibpqcompat")?.trim().toLowerCase()

    if (
      useLibpqCompat !== "true" &&
      (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca")
    ) {
      parsed.searchParams.set("sslmode", "verify-full")
      return parsed.toString()
    }
  } catch {
    return connectionString
  }

  return connectionString
}

function prismaLogLevels(): Prisma.LogLevel[] {
  if (process.env.PRISMA_QUERY_LOGGING === "true") return ["query", "error", "warn"]
  if (process.env.NODE_ENV === "development") return ["error", "warn"]
  return ["error"]
}
