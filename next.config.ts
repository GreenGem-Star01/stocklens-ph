import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// script-src/style-src need 'unsafe-inline': ThemeInitScript renders an
// inline <script> to avoid a flash of the wrong theme before hydration,
// and chart panels/components set inline style={{...}} throughout. A
// nonce-based CSP would let us drop that, but requires middleware to
// generate and thread a per-request nonce — not done here.
// vercel.live/vercel-scripts.com are for the Vercel preview-comments
// widget (active on this repo's PRs), not needed in production but
// harmless to always allow.
// 'unsafe-eval' is dev-only — confirmed via the actual React warning this
// throws without it ("React will never use eval() in production mode"):
// dev mode uses eval() to reconstruct call stacks for debugging, so
// omitting it broke `npm run dev` outright (blank tabs, no hydration).
// Production doesn't need it, so it isn't weakened there.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel-scripts.com${
    process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""
  }`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Sentry ingest — covers all three data regions since the account's
  // region isn't known at config time. *.sentry.io also lets Sentry's
  // "loader script" variant work if that's ever adopted instead of the
  // current @sentry/nextjs SDK.
  "connect-src 'self' https://vercel.live wss://*.pusher.com https://*.pusher.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io",
  "frame-src https://vercel.live",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

// Not using Sentry's tunnelRoute (proxies event delivery same-origin,
// which would let the CSP above stay untouched): it's implemented as a
// webpack rewrite, and this project builds with Turbopack — confirmed by
// curling the tunnel path in a real build and getting a plain 404 rather
// than Sentry's collector. connect-src is widened instead, since that
// works regardless of bundler.
// org/project/authToken only matter for source-map upload at build time;
// left undefined (no SENTRY_AUTH_TOKEN configured) this step is skipped,
// not a hard failure — see docs/OBSERVABILITY.md.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
