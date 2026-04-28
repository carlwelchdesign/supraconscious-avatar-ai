export function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const secretKey = process.env.CLERK_SECRET_KEY

  return Boolean(
    publishableKey
      && secretKey
      && /^pk_(test|live)_[A-Za-z0-9_-]+$/.test(publishableKey)
      && /^sk_(test|live)_[A-Za-z0-9_-]+$/.test(secretKey)
      && publishableKey.length > 50
      && secretKey.length > 50
      && !publishableKey.includes("your_")
      && !secretKey.includes("your_")
  )
}

export function isLocalDemoAuthEnabled() {
  return !isClerkConfigured() && process.env.NODE_ENV !== "production"
}

export function getAuthConfigurationState() {
  if (isClerkConfigured()) return "configured"
  if (isLocalDemoAuthEnabled()) return "local-demo"
  return "misconfigured"
}

export function getAuthConfigurationMessage() {
  if (isLocalDemoAuthEnabled()) {
    return "Clerk keys are not configured. Local demo mode is active."
  }

  return "Authentication is not configured. Set valid Clerk publishable and secret keys before using account features."
}
