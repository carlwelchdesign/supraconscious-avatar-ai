import "server-only"

import { headers } from "next/headers"
import { readClientIpFromHeaders } from "./client-ip-core"

export async function readClientIp() {
  try {
    return readClientIpFromHeaders(await headers())
  } catch {
    return null
  }
}
