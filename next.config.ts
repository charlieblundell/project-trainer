import type { NextConfig } from "next";

/**
 * Baseline hardening for every response. A full script-level Content Security
 * Policy is deliberately left out for now: Supabase auth, Google sign-in and
 * (soon) Stripe checkout all load from other origins, and a CSP that's wrong
 * breaks sign-in silently. frame-ancestors is safe on its own and stops the
 * app being embedded in someone else's page to trick clicks out of users.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /*
   * PostHog (EU) reached through the app's own address, so analytics blockers
   * aimed at posthog.com don't hide whole groups of people from the numbers.
   */
  rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://eu-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://eu.i.posthog.com/:path*" },
    ];
  },
  // PostHog's API paths end in a slash; Next's redirect would break them.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
