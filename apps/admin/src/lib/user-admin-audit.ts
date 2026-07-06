export function buildAdminSessionRevocationMetadata(input: {
  emailHash: string
  revokedSessionCount: number
  scopes: Array<string | null | undefined>
}) {
  return {
    emailHash: input.emailHash,
    revokedSessionCount: input.revokedSessionCount,
    sessionScopes: Array.from(new Set(input.scopes.map((scope) => scope ?? "unknown"))).sort(),
  }
}
