import { NextResponse } from "next/server"

export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME ?? "co.supraconscious.inner_council_mobile"
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim())
    .filter(Boolean)

  return NextResponse.json([
    {
      relation: [
        "delegate_permission/common.handle_all_urls",
        "delegate_permission/common.get_login_creds",
      ],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ])
}
