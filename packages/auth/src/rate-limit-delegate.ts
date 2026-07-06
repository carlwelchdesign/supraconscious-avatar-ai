export type AuthRateLimitBucketDelegate = {
  findMany(args: {
    where: {
      scope: string
      bucketKey: { in: string[] }
      windowStart: Date
    }
    select: { count: true }
  }): Promise<Array<{ count: number }>>
}

export type AuthRateLimitPrismaClient = {
  authRateLimitBucket?: unknown
  $executeRaw?: unknown
}

export function getUsableAuthRateLimitBucketDelegate(client: AuthRateLimitPrismaClient) {
  const delegate = client.authRateLimitBucket
  if (!delegate || typeof delegate !== "object") return null
  if (typeof (delegate as { findMany?: unknown }).findMany !== "function") return null

  return delegate as AuthRateLimitBucketDelegate
}

export function hasUsableAuthRateLimitWriteClient(client: AuthRateLimitPrismaClient) {
  return Boolean(getUsableAuthRateLimitBucketDelegate(client) && typeof client.$executeRaw === "function")
}
