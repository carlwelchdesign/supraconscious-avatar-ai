import { isIP } from "node:net"

type HeaderReader = {
  get(name: string): string | null
}

const CLIENT_IP_HEADERS = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"] as const

export function readClientIpFromHeaders(headerStore: HeaderReader) {
  for (const headerName of CLIENT_IP_HEADERS) {
    const ip = readFirstIpFromHeader(headerStore.get(headerName))
    if (ip) return ip
  }

  return null
}

export function readFirstIpFromHeader(value: string | null | undefined) {
  const candidates = value?.split(",") ?? []

  for (const candidate of candidates) {
    const normalized = normalizeIpCandidate(candidate)
    if (normalized) return normalized
  }

  return null
}

function normalizeIpCandidate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const bracketedIpv6 = trimmed.match(/^\[([^\]]+)\](?::\d+)?$/)
  if (bracketedIpv6?.[1] && isIP(bracketedIpv6[1])) return bracketedIpv6[1]

  if (isIP(trimmed)) return trimmed

  const ipv4WithPort = trimmed.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/)
  if (ipv4WithPort?.[1] && isIP(ipv4WithPort[1])) return ipv4WithPort[1]

  return null
}
