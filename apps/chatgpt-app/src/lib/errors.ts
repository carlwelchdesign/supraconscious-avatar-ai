export function logOperationalError(context: string, error: unknown) {
  if (process.env.NODE_ENV === "production") {
    const name = error instanceof Error ? error.name : "NonError"
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(context, { name, message })
    return
  }

  console.error(context, error)
}

export function readPublicErrorMessage(error: unknown, fallback = "Tool execution failed") {
  if (process.env.NODE_ENV === "production") {
    return fallback
  }

  return error instanceof Error ? error.message : fallback
}
