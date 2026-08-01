import * as Sentry from "@sentry/nextjs";

// No-ops if NEXT_PUBLIC_SENTRY_DSN is unset (e.g. local dev, PR previews
// without the secret configured) — see docs/OBSERVABILITY.md.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  enableLogs: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
