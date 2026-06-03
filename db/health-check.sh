#!/usr/bin/env bash
# Standalone market DB health check (same as npm run health:market).
# Usage: ./db/health-check.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env.ingest" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env.ingest"
  set +a
fi

if command -v node >/dev/null 2>&1; then
  export PATH="$(dirname "$(command -v node)"):${PATH}"
fi

npm run health:market
