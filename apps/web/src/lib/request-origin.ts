export function requestOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host")
  if (forwardedHost) return `${forwardedProto ?? "https"}://${forwardedHost}`
  return new URL(request.url).origin
}
