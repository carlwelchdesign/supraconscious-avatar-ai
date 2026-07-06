import { ZodError } from "zod"

type PrivateApiErrorOptions = {
  fallback: string
  status?: number
}

export function readPrivateApiError(error: unknown, options: PrivateApiErrorOptions) {
  if (error instanceof ZodError) {
    return {
      error: error.issues[0]?.message ?? options.fallback,
      status: 400,
    }
  }

  if (error instanceof Error && error.message === "Unauthorized") {
    return {
      error: "Unauthorized",
      status: 401,
    }
  }

  return {
    error: options.fallback,
    status: options.status ?? 400,
  }
}
