import { Request, Response, NextFunction } from "express"
import { classifyJournalSafety } from "@inner-avatar/ai"

type ClassifyJournalSafetyFn = (text: string) => Promise<any>

export function createSafetyMiddleware(classifyFn: ClassifyJournalSafetyFn = classifyJournalSafety) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract text from request body for safety checking
      const body = req.body
      let textToCheck: string | undefined

      if (body.text) {
        textToCheck = body.text
      } else if (body.entryId) {
        // Would need to fetch text from database, but for middleware we'll skip for now
        // In production, fetch the entry text here
      }

      if (textToCheck) {
        const safety = await classifyFn(textToCheck)
        req.body._safety = safety // Attach safety result to request

        // If crisis, we might want to modify the request or response
        // But for now, let the tools handle it
      }

      next()
    } catch (error) {
      console.error('Safety middleware error:', error)
      // Don't fail the request, just log and continue
      next()
    }
  }
}

export const safetyMiddleware = createSafetyMiddleware()