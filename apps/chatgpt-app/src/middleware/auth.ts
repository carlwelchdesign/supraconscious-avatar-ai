import { Request, Response, NextFunction } from "express"

export interface AuthenticatedRequest extends Request {
  userId?: string
}

// For demo purposes, we'll allow anonymous access
// In production, this would validate JWT tokens or session cookies
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // For now, allow anonymous access for demo
    // In production: validate token from Authorization header or session cookie
    req.userId = undefined // Would be set to actual user ID
    next()
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" })
  }
}