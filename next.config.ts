import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import withSerwistInit from "@serwist/next";
import { withSentryConfig } from "@sentry/nextjs";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            {
              key: "X-Frame-Options",
              value: "DENY",
            },
            {
              key: "X-XSS-Protection",
              value: "1; mode=block",
            },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains; preload",
            },
          ],
        },
      ];
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "lh3.googleusercontent.com",
        },
      ],
    },
    logging: {
      fetches: {
        fullUrl: isDev,
      },
      browserToTerminal: isDev ? "warn" : false,
    },
  };
};

const withSentryAndSerwist = (phase: string) => {
  const config = nextConfig(phase);
  const sentryConfig = withSentryConfig(config, {
    silent: true,
    org: "buddybills",
    project: "buddybills",
    widenClientFileUpload: true,
    sourcemaps: {
      disable: true,
    },
  });

  return withSerwist(sentryConfig);
};

export default withSentryAndSerwist;
