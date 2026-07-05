import { Request, Response, NextFunction } from "express"

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    req.userId = undefined
    const configuredToken = process.env.CHATGPT_APP_API_TOKEN

    if (configuredToken) {
      const providedToken = readBearerToken(req.headers.authorization)
      if (providedToken !== configuredToken) {
        return res.status(401).json({ error: "Authentication failed" })
      }

      const userId = readUserId(req.headers["x-inner-avatar-user-id"])
      if (userId) req.userId = userId
    }

    next()
  } catch {
    res.status(401).json({ error: "Authentication failed" })
  }
}

function readBearerToken(value: string | undefined) {
  const match = value?.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ""
}

function readUserId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const userId = raw?.trim()
  return userId && /^[A-Za-z0-9_-]{8,}$/.test(userId) ? userId : undefined
}
