import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { APP_SECURITY_HEADERS } from "@inner-avatar/config/security-headers"
import path from "node:path"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...APP_SECURITY_HEADERS],
      },
    ]
  },
  transpilePackages: [
    "@inner-avatar/ai",
    "@inner-avatar/auth",
    "@inner-avatar/db",
    "@inner-avatar/types",
    "@inner-avatar/ui",
  ],
}

export default withNextIntl(nextConfig)
