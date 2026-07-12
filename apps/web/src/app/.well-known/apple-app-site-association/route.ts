import { NextResponse } from "next/server"

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID ?? ""
  const bundleId = process.env.IOS_BUNDLE_ID ?? "co.supraconscious.innerCouncilMobile"
  const appId = teamId ? `${teamId}.${bundleId}` : bundleId

  return NextResponse.json({
    applinks: {
      apps: [],
      details: [{ appIDs: [appId], components: [{ "/": "/*" }] }],
    },
    webcredentials: {
      apps: [appId],
    },
  })
}
