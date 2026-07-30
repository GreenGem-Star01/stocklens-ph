import type { NextConfig } from "next";

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
  "connect-src 'self' https://vercel.live wss://*.pusher.com https://*.pusher.com",
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

export default nextConfig;
