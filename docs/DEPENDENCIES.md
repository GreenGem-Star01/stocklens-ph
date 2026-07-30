# Dependency warnings — what's safe to touch, what isn't

Two things show up on a fresh `npm install`: an `EBADENGINE` warning and
`npm audit` reporting vulnerabilities. Neither currently has a safe fix
available. This doc explains why, what was actually done, and how to
re-check in the future without accidentally breaking the build.

## `EBADENGINE`: `@prisma/streams-local@0.1.11` wants Node >=22

```
npm warn EBADENGINE Unsupported engine {
  package: '@prisma/streams-local@0.1.11',
  required: { bun: '>=1.2.0', node: '>=22.0.0' },
  current: { node: 'v20.19.5', npm: '10.8.2' }
}
```

This is a **warning, not an error** — `npm install` still completes and
the app builds/lints/tests fine on Node 20 (confirmed directly). It's a
transitive dependency of Prisma 7's own tooling, unrelated to anything
this app actually uses.

**Not fixed, on purpose:** the only way to silence it is upgrading the
local Node version to 22+, which is a system-wide change (affects every
project on the machine, not just this one) — not something to do as a
side effect of a dependency warning. If you want it gone:

```bash
nvm install 22
nvm use 22
```

Safe to ignore otherwise.

## `npm audit`: 12 high vulnerabilities, no safe fix today

```bash
npm audit
```

Last checked 2026-07-30, after bumping to `@prisma/client@7.9.1`,
`prisma@7.9.1`, `next@16.2.12`, `eslint-config-next@16.2.12` (latest
patches within existing ranges). Previously this was 19 (4 moderate, 15
high) — the `shadcn` and `prisma`→`@prisma/dev` chains from that count
are gone now (fixed upstream since), but `eslint`'s own transitive
`minimatch`/`brace-expansion` showed up as newly-flagged in the
meantime. Net effect: fewer vulnerabilities, but the same underlying
blocker as before, not a new category of problem — see below.

Every one of these traces back to one of two places, and **both
require either a real downgrade or an unreleased upstream fix** — not
something to force through:

| Vulnerable via | `npm audit`'s suggested "fix" | Why not |
|---|---|---|
| `next` → bundled `postcss`/`sharp` | Downgrade to `next@9.3.3` | 7 major versions back — would break the entire app, not fix it |
| `eslint` (and everything that bundles it: `eslint-config-next`, `eslint-plugin-import`/`jsx-a11y`/`react`, `minimatch`, `brace-expansion`, `@eslint/config-array`, `@eslint/eslintrc`) | Major bump to `eslint@10.8.0` | `npm audit`'s own `fixAvailable` marks this `isSemVerMajor: true` — and it's blocked anyway: `eslint-config-next`'s bundled plugins don't declare `eslint@10` peer support yet |

**Verified this directly** (not assumed) before writing this doc, and
re-verified 2026-07-30 after reapplying the version bumps:

```bash
npm audit fix                                        # patch-level only, no version pins changed
npm install @prisma/client@^7.9.0 prisma@^7.9.0       # latest within existing range
npm install next@16.2.12 eslint-config-next@16.2.12   # latest patch, matched pair
npm audit   # 12 high, 0 moderate/low/critical after every one of the above
```

All three commands above are safe and already applied to this repo — they update small transitive/patch versions and keep `next`/`eslint-config-next` in lockstep (Next's own ESLint config is versioned to match its Next release), but **do not** reduce the vulnerability count to zero. Confirmed via `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`, and `npm run build` after each change — all clean.

**Do not run `npm audit fix --force`** — it exists, and it's exactly the downgrade path in the table above. It will make the app worse, not safer.

## Re-checking later

Once Next.js patches its bundled `postcss`/`sharp`, or
`eslint-config-next` bumps its plugin bundle to support `eslint@10`, a
plain:

```bash
npm outdated
npm audit
```

will show a real fix path (a forward version bump, not a downgrade) —
that's the signal to revisit this, rather than a fixed schedule. Given
how much the `shadcn`/`prisma` picture already shifted between when
this doc was first written and this re-check, it's worth re-running
`npm audit` periodically rather than trusting the table above to stay
accurate indefinitely.
