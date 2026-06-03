#!/usr/bin/env bash
# DSS daily EOD ingest — quotes, bars, health check.
#
# Crontab (Asia/Manila VM, Mon–Fri 18:00):
#   0 18 * * 1-5 /var/www/stocklens-ph/db/cron.example.sh >> /var/log/stocklens-ingest.log 2>&1
#
# Crontab (UTC VM, 18:00 Manila ≈ 10:00 UTC):
#   0 10 * * 1-5 /var/www/stocklens-ph/db/cron.example.sh >> /var/log/stocklens-ingest.log 2>&1
#
# Full runbook: db/DSS-OPS.md

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

log() {
  echo "[$(date -Iseconds)] $*"
}

load_env_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$file"
    set +a
  fi
}

load_env_file "$ROOT/.env.ingest"
if [[ -z "${DATABASE_URL:-}" ]]; then
  load_env_file "$ROOT/.env.local"
fi
if [[ -z "${DATABASE_URL:-}" ]]; then
  load_env_file "$ROOT/.env"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  log "ERROR: DATABASE_URL is not set. Create $ROOT/.env.ingest from .env.ingest.example (see db/DSS-OPS.md)"
  exit 1
fi

if [[ "$DATABASE_URL" == *"HOST.pooler"* || "$DATABASE_URL" == *"USER:PASSWORD"* ]]; then
  log "ERROR: DATABASE_URL is still a placeholder. Paste your Supabase pooler URL into .env.ingest"
  exit 1
fi

# Cron uses a minimal PATH — resolve Node/npm
if [[ -n "${NODE_BIN:-}" && -n "${NPM_BIN:-}" ]]; then
  export PATH="$(dirname "$NODE_BIN"):${PATH}"
elif command -v node >/dev/null 2>&1; then
  export PATH="$(dirname "$(command -v node)"):${PATH}"
else
  log "ERROR: node not found. Set NODE_BIN and NPM_BIN in .env.ingest"
  exit 1
fi

log "Starting EOD ingest (cwd=$ROOT)"
npm run ingest:quotes
npm run ingest:bars
npm run health:market
log "EOD ingest finished OK"
