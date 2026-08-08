import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { APP_SECURITY_HEADERS } from "@inner-avatar/config/security-headers";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...APP_SECURITY_HEADERS],
      },
    ];
  },
  transpilePackages: [
    "@inner-avatar/ai",
    "@inner-avatar/auth",
    "@inner-avatar/billing",
    "@inner-avatar/db",
    "@inner-avatar/types",
    "@inner-avatar/ui",
  ],
};

export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_WEB_PROJECT,
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
