import { getMobileSessionBody } from "@/lib/mobile-auth"
import { privateJson } from "@/lib/private-json"

export async function GET() {
  return privateJson(await getMobileSessionBody())
}
