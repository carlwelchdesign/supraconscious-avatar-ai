import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@inner-avatar/auth",
    "@inner-avatar/db",
    "@inner-avatar/types",
    "@inner-avatar/ui",
  ],
}

export default nextConfig
