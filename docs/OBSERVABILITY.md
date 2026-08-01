# Error monitoring

Before this, an unhandled exception (DB unreachable, forecasts snapshot fetch
failing, an API route throwing) only ever showed up as `console.error` output
in whatever server log you weren't watching, or Vercel's own function logs if
you went looking. Nothing paged anyone.

`@sentry/nextjs` is wired in (client, server, and edge runtimes) but is
**inert until you configure a DSN** — every `Sentry.init()` call reads
`dsn: process.env.NEXT_PUBLIC_SENTRY_DSN` / `process.env.SENTRY_DSN`, and the
SDK no-ops entirely when that's unset. Nothing changes for local dev or CI
unless you opt in.

## What gets reported once configured

- Every uncaught error in an API route or Server Component, via
  `src/instrumentation.ts`'s `onRequestError` hook (Next's native
  App Router hook for this — see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`).
- Client-side errors caught by the three error boundaries
  (`src/app/global-error.tsx`, `src/app/(app)/error.tsx`,
  `src/app/(app)/stock/[ticker]/error.tsx`) — each now calls
  `Sentry.captureException(error)` alongside the existing `console.error`.
- Router transitions (breadcrumb context), via `src/instrumentation-client.ts`.

## Setup

1. Create a free account at [sentry.io](https://sentry.io) and a Next.js
   project.
2. Copy the DSN into `.env.local` (and your Vercel project's env vars) as
   both `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` — see `.env.example`.
3. Restart `npm run dev` / redeploy. That's it for error capture.
4. Optional, for readable stack traces instead of minified ones: set
   `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` (Sentry →
   Settings → Auth Tokens) so `next build` uploads source maps. Skipped
   silently if unset — not a build failure.

## Why the CSP was widened, not tunneled

Sentry's `tunnelRoute` option proxies event delivery through the app's own
domain (e.g. `/monitoring`) instead of the browser calling Sentry's ingest
endpoint directly — which would've meant not touching `next.config.ts`'s
Content-Security-Policy at all. It's implemented as a webpack rewrite,
though, and this project builds with Turbopack: confirmed by actually
curling the tunnel path in a real production build and getting a plain 404
instead of Sentry's collector. `connect-src` in `next.config.ts` is widened
to `*.ingest.sentry.io` / `*.ingest.us.sentry.io` / `*.ingest.de.sentry.io`
instead — covers all three Sentry data regions since the account's region
isn't known at config time, and works regardless of bundler.

## Not covered

- `db/cron.example.sh` (the DSS VM ingest cron) — separate from the app
  runtime this covers. See `db/INGEST.md` for the GitHub Actions ingest
  workflows' own failure alerting (files a GitHub issue on failure).
- Performance monitoring / session replay are configured at a low sample
  rate (`tracesSampleRate: 0.1` in production) rather than off, since Sentry's
  free tier includes a meaningful quota for both — raise or lower per your
  plan and traffic.
